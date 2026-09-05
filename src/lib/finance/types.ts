import type { Tables } from "@/lib/supabase/database.types";
import type { Currency, Severity } from "@/lib/constants";

export type Category = Tables<"categories">;
export type Transaction = Tables<"transactions">;
export type Budget = Tables<"budgets">;
export type RecurringExpense = Tables<"recurring_expenses">;
export type IncomeSource = Tables<"income">;
export type SavingsGoal = Tables<"savings_goals">;
export type Account = Tables<"accounts">;
export type Settings = Tables<"settings">;
export type Profile = Tables<"profiles">;
export type AppNotification = Tables<"notifications">;
export type Debt = Tables<"debts">;

export type DebtState = "settled" | "overdue" | "behind" | "on_track" | "no_plan";

export interface DebtStatus {
  debt: Debt;
  /** Principal converted to the display currency. */
  principal: number;
  /** Sum of repayments (owed) or amounts received back (lent). */
  repaid: number;
  remaining: number;
  percent: number;
  /** Months until due_date (null without a due date). */
  monthsLeft: number | null;
  daysLeft: number | null;
  /** Monthly amount needed to be settled by due_date. */
  requiredMonthly: number | null;
  /** Estimated settlement date at the planned monthly payment. */
  projectedSettleDate: string | null;
  /** Months needed at the planned monthly payment. */
  monthsAtPlan: number | null;
  paidThisCycle: number;
  /** Planned payment still to make this cycle (owed only). */
  dueThisCycle: number;
  state: DebtState;
  lastPaymentDate: string | null;
}

/** Everything the finance engine needs — raw rows from the database + context. */
export interface FinanceSnapshot {
  today: Date;
  currency: Currency;
  rates: Record<Currency, number>;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recurring: RecurringExpense[];
  incomeSources: IncomeSource[];
  goals: SavingsGoal[];
  debts: Debt[];
}

export interface DateRange {
  /** ISO yyyy-MM-dd, inclusive */
  start: string;
  /** ISO yyyy-MM-dd, exclusive */
  end: string;
}

export interface PayCycle extends DateRange {
  isCalendarMonth: boolean;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  nextPayday: string;
}

export interface CategorySpend {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
  count: number;
}

export interface PeriodStats {
  key: string;
  label: string;
  range: DateRange;
  income: number;
  expenses: number;
  savings: number;
  /** income - expenses - savings */
  available: number;
  byCategory: CategorySpend[];
}

export type BudgetState = "ok" | "warning" | "exceeded";

export interface BudgetStatus {
  budget: Budget;
  category: Category | null;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
  state: BudgetState;
}

export type GoalState = "reached" | "on_track" | "behind" | "no_deadline";

export interface GoalStatus {
  goal: SavingsGoal;
  saved: number;
  remaining: number;
  percent: number;
  monthsLeft: number | null;
  /** Monthly amount needed to reach the target by target_date. */
  requiredMonthly: number | null;
  contributedThisMonth: number;
  state: GoalState;
}

export interface UpcomingCharge {
  id: string;
  name: string;
  amount: number;
  date: string;
  icon: string;
  color: string;
  categoryName: string | null;
}

export interface BalancePoint {
  date: string;
  balance: number;
  projected: boolean;
}

export interface Insight {
  id: string;
  kind: string;
  severity: Severity;
  icon: string;
  title: string;
  body?: string;
  href?: string;
}

export interface FinanceSummary {
  currency: Currency;
  rates: Record<Currency, number>;
  today: string;
  salary: {
    configured: boolean;
    amount: number;
    payDay: number | null;
    isVariable: boolean;
    source: IncomeSource | null;
  };
  cycle: PayCycle & {
    income: number;
    salaryReceived: number;
    expenses: number;
    discretionaryExpenses: number;
    recurringPaid: number;
    savings: number;
    byCategory: CategorySpend[];
  };
  /** Real cash balance now (accounts + income − expenses − savings). */
  balance: number;
  balanceAtCycleStart: number;
  upcomingCharges: UpcomingCharge[];
  remainingCharges: number;
  plannedSavings: number;
  remainingSavings: number;
  /** Debt repayments planned this cycle and not yet paid. */
  remainingDebtPayments: number;
  /** balance − remainingCharges − remainingSavings − remainingDebtPayments */
  safeToSpend: number;
  dailyAllowance: number;
  initialDailyAllowance: number;
  todaySpent: number;
  avgDailySpend: number;
  paceRatio: number | null;
  projectedRemaining: number;
  month: PeriodStats & { topExpenses: Transaction[]; dailySpend: { date: string; amount: number }[] };
  previousMonth: PeriodStats;
  /** Previous month, cut at the same day-of-month as today (fair month-to-date comparison). */
  previousMonthToDate: PeriodStats;
  monthChange: { expensesPct: number | null; incomePct: number | null; savingsPct: number | null };
  /** Month-to-date vs previous month-to-date. */
  monthToDateChange: { expensesPct: number | null };
  budgets: BudgetStatus[];
  goals: GoalStatus[];
  totalSavedInGoals: number;
  debts: DebtStatus[];
  /** Remaining amount I still owe (active debts). */
  totalOwed: number;
  /** Remaining amount others still owe me (active debts). */
  totalLent: number;
  balanceHistory: BalancePoint[];
  monthlyTrend: { key: string; label: string; income: number; expenses: number; savings: number }[];
  insights: Insight[];
}
