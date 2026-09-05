import "server-only";
import { cache } from "react";
import { parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getToday } from "./today";
import { computeFinance } from "@/lib/finance/engine";
import { normalizeRates } from "@/lib/finance/currency";
import { advance } from "@/lib/finance/cycles";
import { toISODate } from "@/lib/format";
import type { FinanceSnapshot, FinanceSummary, Profile, Settings, AppNotification } from "@/lib/finance/types";
import type { Currency } from "@/lib/constants";
import type { TablesInsert } from "@/lib/supabase/database.types";

export interface FinanceData {
  userId: string;
  profile: Profile;
  settings: Settings;
  snapshot: FinanceSnapshot;
  summary: FinanceSummary;
  unreadNotifications: number;
}

/**
 * Loads everything for the current user, posts due recurring expenses, and runs the engine.
 * Wrapped in React `cache` so layout + page share one fetch per request.
 */
export const getFinanceData = cache(async (): Promise<FinanceData | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = await getToday();
  const todayISO = toISODate(today);

  let [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  // Self-heal: users created before the trigger existed, or partial bootstraps.
  if (!profile || !settings) {
    await supabase.rpc("ensure_user_bootstrap");
    [{ data: profile }, { data: settings }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    if (!profile || !settings) throw new Error("Impossible d'initialiser le profil.");
  }

  await postDueRecurringExpenses(supabase, user.id, todayISO);

  const [accounts, categories, transactions, budgets, recurring, incomeSources, goals, unread] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("categories").select("*").eq("user_id", user.id).order("sort_order").order("name"),
    supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("budgets").select("*").eq("user_id", user.id),
    supabase.from("recurring_expenses").select("*").eq("user_id", user.id).order("next_date"),
    supabase.from("income").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("savings_goals").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
  ]);

  const snapshot: FinanceSnapshot = {
    today,
    currency: settings.currency as Currency,
    rates: normalizeRates(settings.exchange_rates),
    accounts: accounts.data ?? [],
    categories: categories.data ?? [],
    transactions: transactions.data ?? [],
    budgets: budgets.data ?? [],
    recurring: recurring.data ?? [],
    incomeSources: incomeSources.data ?? [],
    goals: goals.data ?? [],
  };

  return {
    userId: user.id,
    profile,
    settings,
    snapshot,
    summary: computeFinance(snapshot),
    unreadNotifications: unread.count ?? 0,
  };
});

/**
 * Creates the expense transactions for every active recurring expense whose next_date is due,
 * then moves next_date forward. Idempotent thanks to (recurring_expense_id, date) checks.
 */
async function postDueRecurringExpenses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  todayISO: string,
) {
  const { data: due } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .lte("next_date", todayISO);
  if (!due || due.length === 0) return;

  const { data: existing } = await supabase
    .from("transactions")
    .select("recurring_expense_id, date")
    .eq("user_id", userId)
    .in(
      "recurring_expense_id",
      due.map((d) => d.id),
    );
  const seen = new Set((existing ?? []).map((e) => `${e.recurring_expense_id}:${e.date}`));

  for (const r of due) {
    let cursor = parseISO(r.next_date);
    let guard = 0;
    const rows: TablesInsert<"transactions">[] = [];
    while (toISODate(cursor) <= todayISO && guard++ < 120) {
      const iso = toISODate(cursor);
      if (!seen.has(`${r.id}:${iso}`)) {
        rows.push({
          user_id: userId,
          type: "expense",
          amount: r.amount,
          currency: r.currency,
          category_id: r.category_id,
          description: r.name,
          date: iso,
          payment_method: r.payment_method,
          recurring_expense_id: r.id,
          is_demo: r.is_demo,
        });
      }
      cursor = advance(cursor, r.frequency, r.day_of_month);
    }
    if (rows.length) await supabase.from("transactions").insert(rows);
    await supabase.from("recurring_expenses").update({ next_date: toISODate(cursor) }).eq("id", r.id);
  }
}

export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  return data ?? [];
}
