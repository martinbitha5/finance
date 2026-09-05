"use server";

import { parseISO } from "date-fns";
import { recurringSchema, uuid, type RecurringInput } from "@/lib/validation/schemas";
import { alignToWeekdays, normalizeWeekdays } from "@/lib/finance/cycles";
import { toISODate } from "@/lib/format";
import { parseInput, requireUser, run, type ActionResult } from "./_helpers";

/**
 * Derives the storage fields from the form: day_of_month for monthly charges, the weekday
 * selection for weekly ones (with next_date moved to the first selected weekday).
 */
function normalize(d: RecurringInput) {
  const weekdays = d.frequency === "weekly" ? normalizeWeekdays(d.weekdays) : null;
  const next_date = weekdays ? toISODate(alignToWeekdays(parseISO(d.next_date), weekdays)) : d.next_date;
  return {
    name: d.name,
    amount: d.amount,
    currency: d.currency,
    category_id: d.category_id,
    frequency: d.frequency,
    next_date,
    payment_method: d.payment_method,
    is_active: d.is_active,
    day_of_month: d.frequency === "monthly" ? parseISO(d.next_date).getDate() : null,
    weekdays,
  };
}

export async function createRecurring(input: unknown): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const parsed = parseInput(recurringSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("recurring_expenses")
      .insert({ ...normalize(parsed.data), user_id: user.id })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { id: data.id } };
  });
}

export async function updateRecurring(id: string, input: unknown): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const parsed = parseInput(recurringSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("recurring_expenses").update(normalize(parsed.data)).eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  });
}

export async function toggleRecurring(id: string, isActive: boolean): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("recurring_expenses").update({ is_active: !!isActive }).eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  });
}

export async function deleteRecurring(id: string): Promise<ActionResult<null>> {
  return run(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Identifiant invalide" };
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("recurring_expenses").delete().eq("id", id).eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  });
}
