"use server";

import { settingsSchema } from "@/lib/validation/schemas";
import { normalizeRates } from "@/lib/finance/currency";
import { parseInput, requireUser, revalidateApp, run, type ActionResult } from "./_helpers";

export async function saveSettings(input: unknown): Promise<ActionResult<null>> {
  return run(async () => {
    const parsed = parseInput(settingsSchema, input);
    if (!parsed.ok) return parsed;
    const { supabase, user } = await requireUser();
    const d = parsed.data;
    const { data: current } = await supabase.from("settings").select("exchange_rates").eq("user_id", user.id).maybeSingle();
    const rates = normalizeRates(current?.exchange_rates);
    if (d.rate_CDF) rates.CDF = d.rate_CDF;
    if (d.rate_EUR) rates.EUR = d.rate_EUR;
    if (d.rate_GBP) rates.GBP = d.rate_GBP;

    const { error } = await supabase
      .from("settings")
      .update({ currency: d.currency, theme: d.theme, notifications_enabled: d.notifications_enabled, exchange_rates: rates })
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
    if (d.display_name !== undefined) {
      await supabase.from("profiles").update({ display_name: d.display_name || null }).eq("id", user.id);
    }
    revalidateApp();
    return { ok: true, data: null };
  });
}

export async function completeOnboarding(): Promise<ActionResult<null>> {
  return run(async () => {
    const { supabase, user } = await requireUser();
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
    revalidateApp();
    return { ok: true, data: null };
  });
}
