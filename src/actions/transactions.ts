"use server";

import { transactionSchema, uuid } from "@/lib/validation/schemas";
import { INCOME_TYPE_CATEGORY_SLUG } from "@/lib/constants";
import { parseInput, requireUser, run, type ActionResult } from "./_helpers";
import { refreshDebtSettlement } from "./debts";

/** Marks a goal completed when its saved amount reaches the target. */
async function refreshGoalCompletion(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], goalId: string) {
  const { data: goal } = await supabase.from("savings_goals").select("id, target_amount, initial_amount, is_completed").eq("id", goalId).maybeSingle();
  if (!goal) return;
  const { data: contributions } = await supabase.from("transactions").select("amount").eq("savings_goal_id", goalId).eq("type", "saving");
  const saved = Number(goal.initial_amount) + (contributions ?? []).reduce((a, c) => a + Number(c.amount), 0);
  const done = saved >= Number(goal.target_amount);
  if (done !== goal.is_completed) await supabase.from("savings_goals").update({ is_completed: done }).eq("id", goalId);
}

/** Picks the right category automatically for income / saving entries when none is given. */
async function resolveCategory(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  data: { type: string; category_id: string | null; income_id: string | null },
) {
  if (data.category_id) return data.category_id;
  let slug: string | null = null;
  if (data.type === "saving") slug = "saving";
  if (data.type === "income") {
    if (data.income_id) {
      const { data: src } = await supabase.from("income").select("type").eq("id", data.income_id).maybeSingle();
      slug = src ? INCOME_TYPE_CATEGORY_SLUG[src.type] : "other_income";
    } else slug = "other_income";
  }
  if (!slug) return null;
  const { data: cat } = await supabase.from("categories").select("id").eq("user_id", userId).eq("slug", slug).maybeSingle();
  return cat?.id ?? null;
}

export async function createTransaction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const parsed = parseInput(transactionSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const d = parsed.data;
    const category_id = await resolveCategory(supabase, user.id, d);
    const { data, error } = await supabase
      .from("transactions")
      .insert({ ...d, category_id, user_id: user.id, notes: d.notes ?? null })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    if (d.type === "saving" && d.savings_goal_id) await refreshGoalCompletion(supabase, d.savings_goal_id);
    if (d.type === "income") await autoSaveFromSalary(supabase, user.id, data.id, { amount: d.amount, currency: d.currency, date: d.date, income_id: d.income_id, category_id });
    return { ok: true, data: { id: data.id } };
  });
}

/**
 * « Épargne dès la paie » : quand un salaire est enregistré et que le réglage est en mode
 * automatique, crée aussitôt l'épargne correspondante (montant fixe ou % du salaire), liée au
 * salaire (supprimée avec lui). Sans le mode automatique, le montant est seulement protégé.
 */
async function autoSaveFromSalary(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  salaryTxId: string,
  tx: { amount: number; currency: "USD" | "CDF" | "EUR" | "GBP"; date: string; income_id: string | null; category_id: string | null },
) {
  const [{ data: settings }, { data: cat }, { data: src }] = await Promise.all([
    supabase.from("settings").select("savings_mode, savings_value, savings_auto, currency").eq("user_id", userId).maybeSingle(),
    tx.category_id ? supabase.from("categories").select("slug").eq("id", tx.category_id).maybeSingle() : Promise.resolve({ data: null }),
    tx.income_id ? supabase.from("income").select("type").eq("id", tx.income_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const isSalary = src?.type === "salary" || cat?.slug === "salary";
  if (!isSalary || !settings || !settings.savings_auto || settings.savings_mode === "none" || Number(settings.savings_value) <= 0) return;

  const value = Number(settings.savings_value);
  const amount = settings.savings_mode === "percent" ? Math.round(tx.amount * value) / 100 : value;
  const currency = settings.savings_mode === "percent" ? tx.currency : (settings.currency as typeof tx.currency);
  if (amount <= 0) return;

  const [{ data: savingCat }, { data: goals }] = await Promise.all([
    supabase.from("categories").select("id").eq("user_id", userId).eq("slug", "saving").maybeSingle(),
    supabase.from("savings_goals").select("id").eq("user_id", userId).eq("is_archived", false).eq("is_completed", false),
  ]);
  const goalId = goals && goals.length === 1 ? goals[0]!.id : null;
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    type: "saving",
    amount,
    currency,
    category_id: savingCat?.id ?? null,
    description: settings.savings_mode === "percent" ? `Épargne automatique · ${value} % du salaire` : "Épargne automatique · salaire",
    date: tx.date,
    payment_method: "transfer",
    savings_goal_id: goalId,
    auto_from_transaction_id: salaryTxId,
  });
  if (!error && goalId) await refreshGoalCompletion(supabase, goalId);
}

export async function updateTransaction(id: string, input: unknown): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const parsed = parseInput(transactionSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const d = parsed.data;
    const { data: before } = await supabase.from("transactions").select("savings_goal_id, debt_id").eq("id", id).maybeSingle();
    const category_id = await resolveCategory(supabase, user.id, d);
    // Keep the debt link when editing a repayment from the transactions screen.
    const debt_id = d.debt_id ?? before?.debt_id ?? null;
    const { error } = await supabase
      .from("transactions")
      .update({ ...d, category_id, debt_id, notes: d.notes ?? null })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    for (const g of new Set([before?.savings_goal_id, d.savings_goal_id])) if (g) await refreshGoalCompletion(supabase, g);
    if (debt_id) await refreshDebtSettlement(supabase, debt_id);
    return { ok: true, data: null };
  });
}

export async function deleteTransaction(id: string): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    const { data: before } = await supabase.from("transactions").select("savings_goal_id, debt_id").eq("id", id).maybeSingle();
    const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    if (before?.savings_goal_id) await refreshGoalCompletion(supabase, before.savings_goal_id);
    if (before?.debt_id) await refreshDebtSettlement(supabase, before.debt_id);
    return { ok: true, data: null };
  });
}

export async function duplicateTransaction(id: string, date?: string): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    const { data: src } = await supabase.from("transactions").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!src) return { ok: false, error: "Transaction introuvable" };
    const { id: _id, created_at: _c, updated_at: _u, recurring_expense_id: _r, debt_id: _d, ...rest } = src;
    void _id; void _c; void _u; void _r; void _d;
    const { data, error } = await supabase
      .from("transactions")
      .insert({ ...rest, date: date ?? src.date, is_demo: false })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    if (src.savings_goal_id) await refreshGoalCompletion(supabase, src.savings_goal_id);
    return { ok: true, data: { id: data.id } };
  });
}
