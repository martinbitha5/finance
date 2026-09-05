/**
 * MONY finance engine — the single source of truth for every number shown in the app.
 * Pure functions: no I/O, fully deterministic given a snapshot.
 */
import { addDays, addMonths, differenceInCalendarMonths, getDaysInMonth, parseISO, subMonths } from "date-fns";
import type {
  BalancePoint,
  BudgetStatus,
  CategorySpend,
  DateRange,
  FinanceSnapshot,
  FinanceSummary,
  GoalStatus,
  PeriodStats,
  Transaction,
  UpcomingCharge,
} from "./types";
import { getPayCycle, inRange, monthRange, occurrencesInRange } from "./cycles";
import { convert } from "./currency";
import { buildInsights } from "./insights";
import { computeDebts } from "./debts";
import { formatMonth, toISODate } from "@/lib/format";
import { round2, sum } from "@/lib/utils";

type Tx = Transaction & { base: number };

export function computeFinance(s: FinanceSnapshot): FinanceSummary {
  const todayISO = toISODate(s.today);
  const conv = (amount: number, from: FinanceSnapshot["currency"]) => convert(amount, from, s.currency, s.rates);
  const categoryById = new Map(s.categories.map((c) => [c.id, c]));

  // Only transactions up to today count as "real"; future-dated ones are planned.
  const all: Tx[] = s.transactions
    .map((t) => ({ ...t, base: conv(t.amount, t.currency) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const posted = all.filter((t) => t.date <= todayISO);

  // ---------- Salary & cycle ----------
  const salarySource =
    s.incomeSources.find((i) => i.type === "salary" && i.is_active && i.is_recurring) ??
    s.incomeSources.find((i) => i.type === "salary" && i.is_active) ??
    null;
  const payDay = salarySource?.pay_day ?? null;
  const cycle = getPayCycle(s.today, payDay);
  const cycleRange: DateRange = { start: cycle.start, end: cycle.end };

  // ---------- Balance ----------
  const accountsBase = sum(s.accounts.map((a) => conv(a.initial_balance, a.currency)));
  const signed = (t: Tx) => (t.type === "income" ? t.base : -t.base);
  const balance = round2(accountsBase + sum(posted.map(signed)));
  const balanceAtCycleStart = round2(accountsBase + sum(posted.filter((t) => t.date < cycle.start).map(signed)));

  // ---------- Cycle stats ----------
  const cycleTx = posted.filter((t) => inRange(t.date, cycleRange));
  const cycleIncome = sum(cycleTx.filter((t) => t.type === "income").map((t) => t.base));
  const salaryReceived = sum(
    cycleTx
      .filter(
        (t) =>
          t.type === "income" &&
          (t.income_id === salarySource?.id || categoryById.get(t.category_id ?? "")?.slug === "salary"),
      )
      .map((t) => t.base),
  );
  const cycleExpenseTx = cycleTx.filter((t) => t.type === "expense");
  const cycleExpenses = sum(cycleExpenseTx.map((t) => t.base));
  const recurringPaid = sum(cycleExpenseTx.filter((t) => t.recurring_expense_id).map((t) => t.base));
  const discretionaryExpenses = cycleExpenses - recurringPaid;
  const cycleSavings = sum(cycleTx.filter((t) => t.type === "saving").map((t) => t.base));

  // ---------- Upcoming recurring charges (not yet posted) until next payday ----------
  const postedRecurringKeys = new Set(
    all.filter((t) => t.recurring_expense_id).map((t) => `${t.recurring_expense_id}:${t.date}`),
  );
  const upcomingCharges: UpcomingCharge[] = [];
  for (const r of s.recurring) {
    if (!r.is_active) continue;
    const dates = occurrencesInRange(r.next_date, r.frequency, r.day_of_month, {
      start: r.next_date < todayISO ? r.next_date : todayISO,
      end: cycle.end,
    });
    const cat = r.category_id ? categoryById.get(r.category_id) : undefined;
    for (const d of dates) {
      if (postedRecurringKeys.has(`${r.id}:${d}`)) continue;
      upcomingCharges.push({
        id: `${r.id}:${d}`,
        name: r.name,
        amount: conv(r.amount, r.currency),
        date: d,
        icon: cat?.icon ?? "🔁",
        color: cat?.color ?? "#94A3B8",
        categoryName: cat?.name ?? null,
      });
    }
  }
  upcomingCharges.sort((a, b) => a.date.localeCompare(b.date));
  const remainingCharges = round2(sum(upcomingCharges.map((c) => c.amount)));
  // Total recurring load for a whole cycle (for the initial daily budget).
  const cycleRecurringTotal = sum(
    s.recurring
      .filter((r) => r.is_active)
      .flatMap((r) =>
        occurrencesInRange(r.next_date < cycle.start ? cycle.start : r.next_date, r.frequency, r.day_of_month, cycleRange).map(() =>
          conv(r.amount, r.currency),
        ),
      ),
  ) + recurringPaid;

  // ---------- Savings plan ----------
  const activeGoals = s.goals.filter((g) => !g.is_archived && !g.is_completed);
  const plannedSavings = round2(sum(activeGoals.map((g) => conv(g.monthly_contribution ?? 0, g.currency))));
  const remainingSavings = round2(Math.max(0, plannedSavings - cycleSavings));

  // ---------- Debts ----------
  const debts = computeDebts(s.debts, all, s.today, cycleRange, s.currency, s.rates);
  const remainingDebtPayments = round2(sum(debts.map((d) => d.dueThisCycle)));
  const plannedDebtPayments = round2(
    sum(debts.filter((d) => d.state !== "settled" && d.debt.direction === "owed").map((d) => Math.min(d.remaining, d.debt.monthly_payment ? conv(d.debt.monthly_payment, d.debt.currency) : 0))),
  );
  const totalOwed = round2(sum(debts.filter((d) => d.state !== "settled" && d.debt.direction === "owed").map((d) => d.remaining)));
  const totalLent = round2(sum(debts.filter((d) => d.state !== "settled" && d.debt.direction === "lent").map((d) => d.remaining)));

  // ---------- Safe to spend & daily allowance ----------
  const safeToSpend = round2(balance - remainingCharges - remainingSavings - remainingDebtPayments);
  const dailyAllowance = round2(Math.max(0, safeToSpend) / cycle.daysRemaining);
  const initialBudget =
    balanceAtCycleStart + (cycleIncome || (salarySource ? conv(salarySource.amount, salarySource.currency) : 0)) - cycleRecurringTotal - plannedSavings - plannedDebtPayments;
  const initialDailyAllowance = round2(Math.max(0, initialBudget) / cycle.daysTotal);

  const todaySpent = round2(sum(posted.filter((t) => t.type === "expense" && t.date === todayISO).map((t) => t.base)));
  const avgDailySpend = round2(discretionaryExpenses / cycle.daysElapsed);
  const paceRatio = initialDailyAllowance > 0 ? round2(avgDailySpend / initialDailyAllowance) : null;
  const projectedRemaining = round2(safeToSpend - avgDailySpend * cycle.daysRemaining);

  // ---------- Month stats ----------
  const thisMonthRange = monthRange(s.today);
  const prevMonthRange = monthRange(subMonths(s.today, 1));
  const monthStats = periodStats(posted, thisMonthRange, s.today, categoryById);
  const prevStats = periodStats(posted, prevMonthRange, subMonths(s.today, 1), categoryById);
  const prevToDateEnd = toISODate(addDays(parseISO(prevMonthRange.start), Math.min(s.today.getDate(), getDaysInMonth(subMonths(s.today, 1)))));
  const prevToDateStats = periodStats(posted, { start: prevMonthRange.start, end: prevToDateEnd < prevMonthRange.end ? prevToDateEnd : prevMonthRange.end }, subMonths(s.today, 1), categoryById);
  const monthTx = posted.filter((t) => inRange(t.date, thisMonthRange));
  const topExpenses = monthTx
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.base - a.base)
    .slice(0, 5);

  const dailySpendMap = new Map<string, number>();
  for (const t of monthTx) if (t.type === "expense") dailySpendMap.set(t.date, (dailySpendMap.get(t.date) ?? 0) + t.base);
  const dailySpend: { date: string; amount: number }[] = [];
  for (let d = parseISO(thisMonthRange.start); toISODate(d) <= todayISO && toISODate(d) < thisMonthRange.end; d = addDays(d, 1)) {
    const iso = toISODate(d);
    dailySpend.push({ date: iso, amount: round2(dailySpendMap.get(iso) ?? 0) });
  }

  const pct = (now: number, before: number) => (before > 0 ? round2(((now - before) / before) * 100) : null);
  const monthChange = {
    expensesPct: pct(monthStats.expenses, prevStats.expenses),
    incomePct: pct(monthStats.income, prevStats.income),
    savingsPct: pct(monthStats.savings, prevStats.savings),
  };
  const monthToDateChange = { expensesPct: pct(monthStats.expenses, prevToDateStats.expenses) };

  // ---------- Budgets (calendar month) ----------
  const budgets: BudgetStatus[] = s.budgets
    .map((b) => {
      const category = categoryById.get(b.category_id) ?? null;
      const amount = conv(b.amount, b.currency);
      const spent = round2(sum(monthTx.filter((t) => t.type === "expense" && t.category_id === b.category_id).map((t) => t.base)));
      const remaining = round2(amount - spent);
      const percent = amount > 0 ? round2((spent / amount) * 100) : 0;
      const state: BudgetStatus["state"] = spent > amount ? "exceeded" : percent >= b.alert_threshold ? "warning" : "ok";
      return { budget: b, category, amount, spent, remaining, percent, state };
    })
    .sort((a, b) => b.percent - a.percent);

  // ---------- Goals ----------
  const goals: GoalStatus[] = s.goals
    .filter((g) => !g.is_archived)
    .map((g) => {
      const contributions = all.filter((t) => t.type === "saving" && t.savings_goal_id === g.id);
      const saved = round2(conv(g.initial_amount, g.currency) + sum(contributions.map((t) => t.base)));
      const target = conv(g.target_amount, g.currency);
      const remaining = round2(Math.max(0, target - saved));
      const percent = target > 0 ? Math.min(100, round2((saved / target) * 100)) : 0;
      const contributedThisMonth = round2(sum(contributions.filter((t) => inRange(t.date, thisMonthRange)).map((t) => t.base)));
      let monthsLeft: number | null = null;
      let requiredMonthly: number | null = null;
      let state: GoalStatus["state"] = "no_deadline";
      if (saved >= target || g.is_completed) {
        state = "reached";
      } else if (g.target_date) {
        monthsLeft = Math.max(0, differenceInCalendarMonths(parseISO(g.target_date), s.today));
        requiredMonthly = monthsLeft > 0 ? round2(remaining / monthsLeft) : remaining;
        const created = parseISO(g.created_at.slice(0, 10));
        const totalMonths = Math.max(1, differenceInCalendarMonths(parseISO(g.target_date), created));
        const elapsed = Math.max(0, differenceInCalendarMonths(s.today, created));
        const expected = conv(g.initial_amount, g.currency) + ((target - conv(g.initial_amount, g.currency)) * elapsed) / totalMonths;
        state = saved + 0.01 >= expected ? "on_track" : "behind";
      } else if (g.monthly_contribution && g.monthly_contribution > 0) {
        monthsLeft = Math.ceil(remaining / conv(g.monthly_contribution, g.currency));
        requiredMonthly = conv(g.monthly_contribution, g.currency);
        state = "on_track";
      }
      return { goal: g, saved, remaining, percent, monthsLeft, requiredMonthly, contributedThisMonth, state };
    })
    .sort((a, b) => (a.state === "reached" ? 1 : 0) - (b.state === "reached" ? 1 : 0) || b.percent - a.percent);
  const totalSavedInGoals = round2(sum(goals.map((g) => g.saved)));

  // ---------- Balance history for the current cycle (+ projection) ----------
  const balanceHistory: BalancePoint[] = [];
  {
    let running = balanceAtCycleStart;
    const byDay = new Map<string, number>();
    for (const t of cycleTx) byDay.set(t.date, (byDay.get(t.date) ?? 0) + signed(t));
    for (let d = parseISO(cycle.start); toISODate(d) <= todayISO; d = addDays(d, 1)) {
      const iso = toISODate(d);
      running = round2(running + (byDay.get(iso) ?? 0));
      balanceHistory.push({ date: iso, balance: running, projected: false });
    }
    // projection until next payday at the current pace, minus upcoming charges on their dates
    let proj = balance;
    for (let d = addDays(s.today, 1); toISODate(d) < cycle.end; d = addDays(d, 1)) {
      const iso = toISODate(d);
      proj = round2(proj - avgDailySpend - sum(upcomingCharges.filter((c) => c.date === iso).map((c) => c.amount)));
      balanceHistory.push({ date: iso, balance: proj, projected: true });
    }
  }

  // ---------- 6-month trend ----------
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const ref = subMonths(s.today, 5 - i);
    const r = monthRange(ref);
    const tx = posted.filter((t) => inRange(t.date, r));
    return {
      key: r.start.slice(0, 7),
      label: formatMonth(ref).slice(0, 3),
      income: round2(sum(tx.filter((t) => t.type === "income").map((t) => t.base))),
      expenses: round2(sum(tx.filter((t) => t.type === "expense").map((t) => t.base))),
      savings: round2(sum(tx.filter((t) => t.type === "saving").map((t) => t.base))),
    };
  });

  const summary: FinanceSummary = {
    currency: s.currency,
    rates: s.rates,
    today: todayISO,
    salary: {
      configured: !!salarySource,
      amount: salarySource ? conv(salarySource.amount, salarySource.currency) : 0,
      payDay,
      isVariable: salarySource?.is_variable ?? false,
      source: salarySource,
    },
    cycle: {
      ...cycle,
      income: round2(cycleIncome),
      salaryReceived: round2(salaryReceived),
      expenses: round2(cycleExpenses),
      discretionaryExpenses: round2(discretionaryExpenses),
      recurringPaid: round2(recurringPaid),
      savings: round2(cycleSavings),
      byCategory: categoryBreakdown(cycleExpenseTx, categoryById),
    },
    balance,
    balanceAtCycleStart,
    upcomingCharges,
    remainingCharges,
    plannedSavings,
    remainingSavings,
    remainingDebtPayments,
    safeToSpend,
    dailyAllowance,
    initialDailyAllowance,
    todaySpent,
    avgDailySpend,
    paceRatio,
    projectedRemaining,
    month: { ...monthStats, topExpenses, dailySpend },
    previousMonth: prevStats,
    previousMonthToDate: prevToDateStats,
    monthChange,
    monthToDateChange,
    budgets,
    goals,
    totalSavedInGoals,
    debts,
    totalOwed,
    totalLent,
    balanceHistory,
    monthlyTrend,
    insights: [],
  };
  summary.insights = buildInsights(summary);
  return summary;
}

// ---------- helpers ----------

function periodStats(
  posted: Tx[],
  range: DateRange,
  ref: Date,
  categoryById: Map<string, FinanceSnapshot["categories"][number]>,
): PeriodStats {
  const tx = posted.filter((t) => inRange(t.date, range));
  const income = round2(sum(tx.filter((t) => t.type === "income").map((t) => t.base)));
  const expenses = round2(sum(tx.filter((t) => t.type === "expense").map((t) => t.base)));
  const savings = round2(sum(tx.filter((t) => t.type === "saving").map((t) => t.base)));
  return {
    key: range.start.slice(0, 7),
    label: formatMonth(ref),
    range,
    income,
    expenses,
    savings,
    available: round2(income - expenses - savings),
    byCategory: categoryBreakdown(tx.filter((t) => t.type === "expense"), categoryById),
  };
}

function categoryBreakdown(expenseTx: Tx[], categoryById: Map<string, FinanceSnapshot["categories"][number]>): CategorySpend[] {
  const total = sum(expenseTx.map((t) => t.base));
  const map = new Map<string | null, CategorySpend>();
  for (const t of expenseTx) {
    const cat = t.category_id ? categoryById.get(t.category_id) : undefined;
    const key = cat?.id ?? null;
    const entry = map.get(key) ?? {
      categoryId: key,
      name: cat?.name ?? "Sans catégorie",
      icon: cat?.icon ?? "💳",
      color: cat?.color ?? "#94A3B8",
      amount: 0,
      percent: 0,
      count: 0,
    };
    entry.amount = round2(entry.amount + t.base);
    entry.count += 1;
    map.set(key, entry);
  }
  return Array.from(map.values())
    .map((e) => ({ ...e, percent: total > 0 ? round2((e.amount / total) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/** Convenience: the month key of a date, e.g. "2026-09". */
export function monthKey(d: Date) {
  return toISODate(d).slice(0, 7);
}

export { addMonths };
