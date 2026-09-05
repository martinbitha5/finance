"use server";

import { debtPaymentSchema, debtSchema, uuid } from "@/lib/validation/schemas";
import { parseInput, requireUser, revalidateApp, run, type ActionResult } from "./_helpers";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

async function categoryId(supabase: Supabase, userId: string, slug: string) {
  const { data } = await supabase.from("categories").select("id").eq("user_id", userId).eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

/** Marks a debt settled when repayments reach the principal (and re-opens it otherwise). */
export async function refreshDebtSettlement(supabase: Supabase, debtId: string, today?: string) {
  const { data: debt } = await supabase.from("debts").select("id, principal, direction, is_settled").eq("id", debtId).maybeSingle();
  if (!debt) return;
  const repayType = debt.direction === "owed" ? "expense" : "income";
  const { data: rows } = await supabase.from("transactions").select("amount").eq("debt_id", debtId).eq("type", repayType);
  const repaid = (rows ?? []).reduce((a, r) => a + Number(r.amount), 0);
  const settled = repaid >= Number(debt.principal) - 0.005;
  if (settled !== debt.is_settled) {
    await supabase.from("debts").update({ is_settled: settled, settled_at: settled ? (today ?? new Date().toISOString().slice(0, 10)) : null }).eq("id", debtId);
  }
}

export async function createDebt(input: unknown): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const parsed = parseInput(debtSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const d = parsed.data;
    const { data: debt, error } = await supabase
      .from("debts")
      .insert({
        user_id: user.id,
        direction: d.direction,
        name: d.name,
        counterparty: d.counterparty || null,
        principal: d.principal,
        currency: d.currency,
        start_date: d.start_date,
        due_date: d.due_date,
        monthly_payment: d.monthly_payment,
        notes: d.notes || null,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };

    const rows = [];
    if (d.record_disbursement) {
      // owed: I received the money (income). lent: I gave the money (expense).
      rows.push({
        user_id: user.id,
        type: d.direction === "owed" ? ("income" as const) : ("expense" as const),
        amount: d.principal,
        currency: d.currency,
        category_id: await categoryId(supabase, user.id, d.direction === "owed" ? "debt_income" : "debt"),
        description: d.direction === "owed" ? `Emprunt · ${d.name}` : `Prêt · ${d.name}`,
        date: d.start_date,
        payment_method: "cash" as const,
        debt_id: debt.id,
      });
    }
    if (d.already_repaid > 0) {
      rows.push({
        user_id: user.id,
        type: d.direction === "owed" ? ("expense" as const) : ("income" as const),
        amount: Math.min(d.already_repaid, d.principal),
        currency: d.currency,
        category_id: await categoryId(supabase, user.id, d.direction === "owed" ? "debt" : "debt_income"),
        description: d.direction === "owed" ? `Remboursement · ${d.name}` : `Remboursement reçu · ${d.name}`,
        date: d.start_date,
        payment_method: "cash" as const,
        debt_id: debt.id,
      });
    }
    if (rows.length) {
      const { error: txErr } = await supabase.from("transactions").insert(rows);
      if (txErr) return { ok: false, error: txErr.message };
      await refreshDebtSettlement(supabase, debt.id);
    }
    revalidateApp();
    return { ok: true, data: { id: debt.id } };
  });
}

export async function updateDebt(id: string, input: unknown): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const parsed = parseInput(debtSchema.omit({ record_disbursement: true, already_repaid: true }), input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const d = parsed.data;
    const { error } = await supabase
      .from("debts")
      .update({
        direction: d.direction,
        name: d.name,
        counterparty: d.counterparty || null,
        principal: d.principal,
        currency: d.currency,
        start_date: d.start_date,
        due_date: d.due_date,
        monthly_payment: d.monthly_payment,
        notes: d.notes || null,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    await refreshDebtSettlement(supabase, id);
    revalidateApp();
    return { ok: true, data: null };
  });
}

/** Records a repayment (owed) or money received back (lent). */
export async function payDebt(input: unknown): Promise<ActionResult<{ settled: boolean }>> {
  return run(async () => {
    const parsed = parseInput(debtPaymentSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const { data: debt } = await supabase.from("debts").select("id, name, direction").eq("id", parsed.data.debt_id).eq("user_id", user.id).maybeSingle();
    if (!debt) return { ok: false, error: "Dette introuvable" };
    const owed = debt.direction === "owed";
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: owed ? "expense" : "income",
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      category_id: await categoryId(supabase, user.id, owed ? "debt" : "debt_income"),
      description: owed ? `Remboursement · ${debt.name}` : `Remboursement reçu · ${debt.name}`,
      date: parsed.data.date,
      payment_method: parsed.data.payment_method,
      debt_id: debt.id,
    });
    if (error) return { ok: false, error: error.message };
    await refreshDebtSettlement(supabase, debt.id, parsed.data.date);
    const { data: after } = await supabase.from("debts").select("is_settled").eq("id", debt.id).maybeSingle();
    revalidateApp();
    return { ok: true, data: { settled: !!after?.is_settled } };
  });
}

/** Manually closes a debt (e.g. forgiven) or re-opens it. */
export async function setDebtSettled(id: string, settled: boolean, today: string): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("debts").update({ is_settled: settled, settled_at: settled ? today : null }).eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}

export async function deleteDebt(id: string): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    // Linked transactions stay (money really moved); they just lose the link.
    await supabase.from("transactions").update({ debt_id: null }).eq("debt_id", id).eq("user_id", user.id);
    const { error } = await supabase.from("debts").delete().eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}
