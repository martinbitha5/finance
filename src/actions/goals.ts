"use server";

import { contributionSchema, goalSchema, uuid } from "@/lib/validation/schemas";
import { parseInput, requireUser, revalidateApp, run, type ActionResult } from "./_helpers";
import { createTransaction } from "./transactions";

export async function createGoal(input: unknown): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const parsed = parseInput(goalSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const d = parsed.data;
    const { data, error } = await supabase
      .from("savings_goals")
      .insert({ ...d, user_id: user.id, is_completed: d.initial_amount >= d.target_amount })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: { id: data.id } };
  });
}

export async function updateGoal(id: string, input: unknown): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const parsed = parseInput(goalSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("savings_goals").update(parsed.data).eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}

export async function archiveGoal(id: string, archived = true): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("savings_goals").update({ is_archived: archived }).eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}

export async function deleteGoal(id: string): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    // Contributions stay as saving transactions (money was really set aside); unlink them.
    await supabase.from("transactions").update({ savings_goal_id: null }).eq("savings_goal_id", id).eq("user_id", user.id);
    const { error } = await supabase.from("savings_goals").delete().eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}

/** Adds money to a goal: creates a "saving" transaction linked to it. */
export async function contributeToGoal(input: unknown): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const parsed = parseInput(contributionSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const { data: goal } = await supabase.from("savings_goals").select("id, name").eq("id", parsed.data.goal_id).eq("user_id", user.id).maybeSingle();
    if (!goal) return { ok: false, error: "Objectif introuvable" };
    return createTransaction({
      type: "saving",
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      date: parsed.data.date,
      payment_method: parsed.data.payment_method,
      description: `Épargne · ${goal.name}`,
      savings_goal_id: goal.id,
      category_id: null,
      income_id: null,
      account_id: null,
      debt_id: null,
    });
  });
}
