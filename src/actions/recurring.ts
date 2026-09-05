"use server";

import { parseISO } from "date-fns";
import { recurringSchema, uuid } from "@/lib/validation/schemas";
import { parseInput, requireUser, revalidateApp, run, type ActionResult } from "./_helpers";

export async function createRecurring(input: unknown): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const parsed = parseInput(recurringSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const d = parsed.data;
    const { data, error } = await supabase
      .from("recurring_expenses")
      .insert({ ...d, user_id: user.id, day_of_month: d.frequency === "monthly" ? parseISO(d.next_date).getDate() : null })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: { id: data.id } };
  });
}

export async function updateRecurring(id: string, input: unknown): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const parsed = parseInput(recurringSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const d = parsed.data;
    const { error } = await supabase
      .from("recurring_expenses")
      .update({ ...d, day_of_month: d.frequency === "monthly" ? parseISO(d.next_date).getDate() : null })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}

export async function toggleRecurring(id: string, isActive: boolean): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("recurring_expenses").update({ is_active: !!isActive }).eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}

export async function deleteRecurring(id: string): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("recurring_expenses").delete().eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    revalidateApp();
    return { ok: true, data: null };
  });
}
