import "server-only";
import { cache } from "react";
import { parseISO } from "date-fns";
import { createClient, getUser } from "@/lib/supabase/server";
import { getToday } from "./today";
import { computeFinance } from "@/lib/finance/engine";
import { normalizeRates } from "@/lib/finance/currency";
import { advance } from "@/lib/finance/cycles";
import { toISODate } from "@/lib/format";
import type { FinanceSnapshot, FinanceSummary, Profile, Settings, AppNotification } from "@/lib/finance/types";
import type { Currency } from "@/lib/constants";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

export interface FinanceData {
  userId: string;
  email: string | null;
  profile: Profile;
  settings: Settings;
  snapshot: FinanceSnapshot;
  summary: FinanceSummary;
  unreadNotifications: number;
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Loads everything for the current user, posts due recurring expenses, and runs the engine.
 *
 * Request budget (happy path): 1 local JWT check + 1 parallel batch of 10 queries. No waterfall.
 * Wrapped in React `cache` so layout + page (and any service called during the same render)
 * share one fetch per request.
 */
export const getFinanceData = cache(async (): Promise<FinanceData | null> => {
  const [supabase, user, today] = await Promise.all([createClient(), getUser(), getToday()]);
  if (!user) return null;
  const todayISO = toISODate(today);

  let rows = await loadUserRows(supabase, user.id);

  // Self-heal: users created before the trigger existed, or partial bootstraps (rare).
  if (!rows.profile || !rows.settings) {
    await supabase.rpc("ensure_user_bootstrap");
    rows = await loadUserRows(supabase, user.id);
  }
  const { profile, settings } = rows;
  if (!profile || !settings) throw new Error("Impossible d'initialiser le profil.");

  // Only touches the DB when a recurring expense is actually due (at most once per due date).
  const posted = await postDueRecurringExpenses(supabase, user.id, todayISO, rows.recurring);
  if (posted) {
    const [transactions, recurring] = await Promise.all([
      selectTransactions(supabase, user.id),
      selectRecurring(supabase, user.id),
    ]);
    rows = { ...rows, transactions: transactions.data ?? [], recurring: recurring.data ?? [] };
  }

  const snapshot: FinanceSnapshot = {
    today,
    currency: settings.currency as Currency,
    rates: normalizeRates(settings.exchange_rates),
    accounts: rows.accounts,
    categories: rows.categories,
    transactions: rows.transactions,
    budgets: rows.budgets,
    recurring: rows.recurring,
    incomeSources: rows.incomeSources,
    goals: rows.goals,
  };

  return {
    userId: user.id,
    email: user.email,
    profile,
    settings,
    snapshot,
    summary: computeFinance(snapshot),
    unreadNotifications: rows.unread,
  };
});

const selectTransactions = (supabase: Supabase, userId: string) =>
  supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).order("created_at", { ascending: false });

const selectRecurring = (supabase: Supabase, userId: string) =>
  supabase.from("recurring_expenses").select("*").eq("user_id", userId).order("next_date");

/** Every table the app needs, fetched in one parallel batch. */
async function loadUserRows(supabase: Supabase, userId: string) {
  const [profile, settings, accounts, categories, transactions, budgets, recurring, incomeSources, goals, unread] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("settings").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("accounts").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("categories").select("*").eq("user_id", userId).order("sort_order").order("name"),
      selectTransactions(supabase, userId),
      supabase.from("budgets").select("*").eq("user_id", userId),
      selectRecurring(supabase, userId),
      supabase.from("income").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("savings_goals").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false),
    ]);

  return {
    profile: profile.data,
    settings: settings.data,
    accounts: accounts.data ?? [],
    categories: categories.data ?? [],
    transactions: transactions.data ?? [],
    budgets: budgets.data ?? [],
    recurring: recurring.data ?? [],
    incomeSources: incomeSources.data ?? [],
    goals: goals.data ?? [],
    unread: unread.count ?? 0,
  };
}

/**
 * Creates the expense transactions for every active recurring expense whose next_date is due,
 * then moves next_date forward. Works from the already-loaded recurring list, so the common
 * case (nothing due) costs zero queries. Idempotent thanks to (recurring_expense_id, date) checks.
 * Returns true when rows were written and the caller should reload transactions/recurring.
 */
async function postDueRecurringExpenses(
  supabase: Supabase,
  userId: string,
  todayISO: string,
  recurring: Tables<"recurring_expenses">[],
): Promise<boolean> {
  const due = recurring.filter((r) => r.is_active && r.next_date <= todayISO);
  if (due.length === 0) return false;

  const { data: existing } = await supabase
    .from("transactions")
    .select("recurring_expense_id, date")
    .eq("user_id", userId)
    .in(
      "recurring_expense_id",
      due.map((d) => d.id),
    );
  const seen = new Set((existing ?? []).map((e) => `${e.recurring_expense_id}:${e.date}`));

  const rows: TablesInsert<"transactions">[] = [];
  const nextDates: { id: string; next_date: string }[] = [];
  for (const r of due) {
    let cursor = parseISO(r.next_date);
    let guard = 0;
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
    nextDates.push({ id: r.id, next_date: toISODate(cursor) });
  }

  // One insert for every generated transaction, then the next_date updates in parallel.
  if (rows.length) await supabase.from("transactions").insert(rows);
  await Promise.all(
    nextDates.map(({ id, next_date }) => supabase.from("recurring_expenses").update({ next_date }).eq("id", id)),
  );
  return true;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  return data ?? [];
}
