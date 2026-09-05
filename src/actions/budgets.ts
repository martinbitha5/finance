"use server";

import { budgetSchema, uuid } from "@/lib/validation/schemas";
import { parseInput, requireUser, revalidateApp, run, type ActionResult } from "./_helpers";

/** Creates or replaces the monthly budget of a category. */
export async function upsertBudget(input: unknown): Promise<ActionResult<null>> {
  return run(async () => {
    const parsed = parseInput(budgetSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("budgets")
      .upsert({ ...parsed.data, user_id: user.id, is_demo: false }, { onConflict: "user_id,category_id" });
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}

export async function deleteBudget(id: string): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}
