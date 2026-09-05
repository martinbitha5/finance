import { computeFinance } from "./engine";
import { normalizeRates } from "./currency";
import type {
  Account,
  AppNotification,
  Budget,
  Category,
  Debt,
  FinanceSnapshot,
  FinanceSummary,
  IncomeSource,
  Profile,
  RecurringExpense,
  SavingsGoal,
  Settings,
  Transaction,
} from "./types";
import type { Currency } from "@/lib/constants";

/**
 * Everything the app needs for one user, exactly as stored in the database.
 * Plain JSON: it travels from server actions to the browser and is persisted on the device.
 */
export interface FinanceRaw {
  userId: string;
  email: string | null;
  profile: Profile;
  settings: Settings;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recurring: RecurringExpense[];
  incomeSources: IncomeSource[];
  goals: SavingsGoal[];
  debts: Debt[];
  /** Latest notifications (most recent first). */
  notifications: AppNotification[];
  unreadNotifications: number;
  /** ISO timestamp of the fetch, used to decide when to revalidate. */
  loadedAt: string;
}

/** Raw rows + the engine's output for a given "today". This is what every screen reads. */
export interface FinanceData {
  userId: string;
  email: string | null;
  profile: Profile;
  settings: Settings;
  snapshot: FinanceSnapshot;
  summary: FinanceSummary;
  notifications: AppNotification[];
  unreadNotifications: number;
}

export function buildSnapshot(raw: FinanceRaw, today: Date): FinanceSnapshot {
  return {
    today,
    currency: raw.settings.currency as Currency,
    rates: normalizeRates(raw.settings.exchange_rates),
    savingsPlan: {
      mode: raw.settings.savings_mode === "amount" || raw.settings.savings_mode === "percent" ? raw.settings.savings_mode : "none",
      value: Number(raw.settings.savings_value) || 0,
      auto: !!raw.settings.savings_auto,
    },
    accounts: raw.accounts,
    categories: raw.categories,
    transactions: raw.transactions,
    budgets: raw.budgets,
    recurring: raw.recurring,
    incomeSources: raw.incomeSources,
    goals: raw.goals,
    debts: raw.debts,
  };
}

/** Runs the (pure) finance engine. Works identically on the server and in the browser. */
export function buildFinanceData(raw: FinanceRaw, today: Date): FinanceData {
  const snapshot = buildSnapshot(raw, today);
  return {
    userId: raw.userId,
    email: raw.email,
    profile: raw.profile,
    settings: raw.settings,
    snapshot,
    summary: computeFinance(snapshot),
    notifications: raw.notifications,
    unreadNotifications: raw.unreadNotifications,
  };
}
