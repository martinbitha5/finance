"use server";

import { incomeSchema, salarySchema, uuid } from "@/lib/validation/schemas";
import { parseInput, requireUser, run, type ActionResult } from "./_helpers";

/** Creates or updates the main recurring salary source (one per user). */
export async function saveSalary(input: unknown): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const parsed = parseInput(salarySchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const d = parsed.data;
    const { data: existing } = await supabase
      .from("income")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "salary")
      .eq("is_recurring", true)
      .order("created_at")
      .limit(1)
      .maybeSingle();

    const payload = {
      type: "salary" as const,
      label: "Salaire",
      amount: d.amount,
      currency: d.currency,
      is_recurring: true,
      frequency: "monthly" as const,
      pay_day: d.pay_day,
      is_variable: d.is_variable,
      is_active: true,
      is_demo: false,
    };

    let id: string;
    if (existing) {
      const { error } = await supabase.from("income").update(payload).eq("id", existing.id);
      if (error) return { ok: false, error: error.message };
      id = existing.id;
    } else {
      const { data, error } = await supabase.from("income").insert({ ...payload, user_id: user.id }).select("id").single();
      if (error) return { ok: false, error: error.message };
      id = data.id;
    }
    return { ok: true, data: { id } };
  });
}

export async function createIncomeSource(input: unknown): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const parsed = parseInput(incomeSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("income").insert({ ...parsed.data, user_id: user.id }).select("id").single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { id: data.id } };
  });
}

export async function updateIncomeSource(id: string, input: unknown): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const parsed = parseInput(incomeSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("income").update(parsed.data).eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  });
}

export async function deleteIncomeSource(id: string): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("income").delete().eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  });
}
