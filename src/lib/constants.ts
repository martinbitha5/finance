import type { Enums } from "@/lib/supabase/database.types";

export const APP_NAME = "MONY";
export const APP_TAGLINE = "Ton argent, en clair.";

export type Currency = Enums<"currency_code">;
export type PaymentMethod = Enums<"payment_method">;
export type TransactionType = Enums<"transaction_type">;
export type IncomeType = Enums<"income_type">;
export type GoalKind = Enums<"goal_kind">;
export type Frequency = Enums<"recurrence_frequency">;
export type Severity = Enums<"notification_severity">;

export const CURRENCIES: { code: Currency; label: string; symbol: string; decimals: number }[] = [
  { code: "USD", label: "Dollar américain", symbol: "$", decimals: 2 },
  { code: "CDF", label: "Franc congolais", symbol: "FC", decimals: 0 },
  { code: "EUR", label: "Euro", symbol: "€", decimals: 2 },
  { code: "GBP", label: "Livre sterling", symbol: "£", decimals: 2 },
];

export const DEFAULT_RATES: Record<Currency, number> = {
  USD: 1,
  CDF: 2850,
  EUR: 0.92,
  GBP: 0.79,
};

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "card", label: "Carte", icon: "💳" },
  { value: "mobile_money", label: "Mobile Money", icon: "📲" },
  { value: "transfer", label: "Virement", icon: "🏦" },
  { value: "other", label: "Autre", icon: "➕" },
];

export const INCOME_TYPES: { value: IncomeType; label: string; icon: string }[] = [
  { value: "salary", label: "Salaire", icon: "💰" },
  { value: "bonus", label: "Bonus", icon: "🎁" },
  { value: "freelance", label: "Freelance", icon: "💻" },
  { value: "business", label: "Business", icon: "🏪" },
  { value: "gift", label: "Cadeau", icon: "🎀" },
  { value: "other", label: "Autre", icon: "➕" },
];

/** Maps an income type to the default category slug seeded for every user. */
export const INCOME_TYPE_CATEGORY_SLUG: Record<IncomeType, string> = {
  salary: "salary",
  bonus: "bonus",
  freelance: "freelance",
  business: "business",
  gift: "gift",
  other: "other_income",
};

export const GOAL_KINDS: { value: GoalKind; label: string; icon: string }[] = [
  { value: "phone", label: "Téléphone", icon: "📱" },
  { value: "car", label: "Voiture", icon: "🚗" },
  { value: "travel", label: "Voyage", icon: "✈️" },
  { value: "house", label: "Maison", icon: "🏡" },
  { value: "emergency", label: "Urgence", icon: "🛟" },
  { value: "custom", label: "Personnalisé", icon: "🎯" },
];

export const FREQUENCIES: { value: Frequency; label: string; short: string }[] = [
  { value: "daily", label: "Chaque jour", short: "jour" },
  { value: "weekly", label: "Chaque semaine", short: "sem." },
  { value: "monthly", label: "Chaque mois", short: "mois" },
  { value: "yearly", label: "Chaque année", short: "an" },
];

export const CATEGORY_COLORS = [
  "#F59E0B",
  "#3B82F6",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#10B981",
  "#EF4444",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#94A3B8",
  "#EAB308",
];

export const CATEGORY_ICONS = [
  "🍔", "🚕", "🏠", "📱", "🛍️", "🎮", "💊", "👨‍👩‍👧", "📚", "📺", "💳",
  "☕", "🍺", "🎬", "🏋️", "✈️", "🐶", "💇", "👗", "⛽", "🎁", "🧾", "💡", "🛠️", "🎓", "🏥", "🚌", "🍕",
];
