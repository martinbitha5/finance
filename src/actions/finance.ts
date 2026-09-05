"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadFinanceRaw } from "@/services/finance-data";
import { getToday } from "@/services/today";
import { syncNotifications } from "@/services/notifications-sync";
import { buildFinanceData, type FinanceRaw } from "@/lib/finance/data";

/**
 * The app's single read endpoint: one call returns everything the device needs.
 * Called by the client store on open, on resume, and whenever it wants fresh data.
 * Returns null when the session is gone (the store then sends the user to /login).
 */
export async function fetchFinance(): Promise<FinanceRaw | null> {
  const raw = await loadFinanceRaw();
  if (!raw) return null;

  // Insight-driven notifications are derived on the server after the response is sent,
  // so they never delay the data. `after` in a server action may use request APIs.
  after(async () => {
    const [supabase, today] = await Promise.all([createClient(), getToday()]);
    const { summary } = buildFinanceData(raw, today);
    await syncNotifications(supabase, raw.userId, summary, raw.settings.notifications_enabled);
  });

  return raw;
}
