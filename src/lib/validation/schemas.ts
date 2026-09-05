import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";

const E = Constants.public.Enums;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Date invalide");

export const amountSchema = z.coerce
  .number({ message: "Montant invalide" })
  .positive("Le montant doit être supérieur à 0")
  .max(999_999_999, "Montant trop élevé")
  .transform((n) => Math.round(n * 100) / 100);

export const currencySchema = z.enum(E.currency_code);
export const paymentMethodSchema = z.enum(E.payment_method);
export const uuid = z.string().uuid();
const optionalUuid = z.preprocess((v) => (v === "" || v === undefined ? null : v), uuid.nullable());

export const transactionSchema = z.object({
  type: z.enum(E.transaction_type),
  amount: amountSchema,
  currency: currencySchema,
  category_id: optionalUuid,
  description: z.string().trim().max(120, "120 caractères max").default(""),
  notes: z.string().trim().max(500).optional().nullable(),
  date: isoDate,
  payment_method: paymentMethodSchema.default("cash"),
  savings_goal_id: optionalUuid,
  income_id: optionalUuid,
  account_id: optionalUuid,
  debt_id: optionalUuid.default(null),
});
export type TransactionInput = z.infer<typeof transactionSchema>;

export const debtSchema = z.object({
  direction: z.enum(E.debt_direction).default("owed"),
  name: z.string().trim().min(1, "Nom requis").max(60),
  counterparty: z.string().trim().max(60).optional().nullable(),
  principal: amountSchema,
  currency: currencySchema,
  start_date: isoDate,
  due_date: z.preprocess((v) => (v === "" || v === undefined ? null : v), isoDate.nullable()).default(null),
  monthly_payment: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().min(0).nullable()).default(null),
  notes: z.string().trim().max(500).optional().nullable(),
  /** Record the initial money movement (received / given) as a transaction. */
  record_disbursement: z.coerce.boolean().default(true),
  /** Amount already repaid before tracking in MONY. */
  already_repaid: z.coerce.number().min(0).default(0),
});
export type DebtInput = z.infer<typeof debtSchema>;

export const debtPaymentSchema = z.object({
  debt_id: uuid,
  amount: amountSchema,
  currency: currencySchema,
  date: isoDate,
  payment_method: paymentMethodSchema.default("cash"),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(40),
  icon: z.string().trim().min(1).max(8),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide"),
  kind: z.enum(E.category_kind).default("expense"),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const budgetSchema = z.object({
  category_id: uuid,
  amount: amountSchema,
  currency: currencySchema,
  alert_threshold: z.coerce.number().int().min(50).max(100).default(80),
});
export type BudgetInput = z.infer<typeof budgetSchema>;

export const recurringSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(60),
  amount: amountSchema,
  currency: currencySchema,
  category_id: optionalUuid,
  frequency: z.enum(E.recurrence_frequency).default("monthly"),
  next_date: isoDate,
  payment_method: paymentMethodSchema.default("card"),
  is_active: z.coerce.boolean().default(true),
});
export type RecurringInput = z.infer<typeof recurringSchema>;

export const incomeSchema = z.object({
  type: z.enum(E.income_type).default("salary"),
  label: z.string().trim().min(1, "Nom requis").max(60),
  amount: z.coerce.number().min(0).max(999_999_999),
  currency: currencySchema,
  is_recurring: z.coerce.boolean().default(false),
  frequency: z.preprocess((v) => (v === "" ? null : v), z.enum(E.recurrence_frequency).nullable()).default(null),
  pay_day: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().int().min(1).max(31).nullable()).default(null),
  is_variable: z.coerce.boolean().default(false),
  is_active: z.coerce.boolean().default(true),
});
export type IncomeInput = z.infer<typeof incomeSchema>;

export const salarySchema = z.object({
  amount: z.coerce.number().min(0).max(999_999_999),
  currency: currencySchema,
  pay_day: z.coerce.number().int().min(1).max(31),
  is_variable: z.coerce.boolean().default(false),
});
export type SalaryInput = z.infer<typeof salarySchema>;

export const goalSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(60),
  icon: z.string().trim().min(1).max(8).default("🎯"),
  kind: z.enum(E.goal_kind).default("custom"),
  target_amount: amountSchema,
  initial_amount: z.coerce.number().min(0).default(0),
  currency: currencySchema,
  target_date: z.preprocess((v) => (v === "" || v === undefined ? null : v), isoDate.nullable()).default(null),
  monthly_contribution: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().min(0).nullable()).default(null),
});
export type GoalInput = z.infer<typeof goalSchema>;

export const contributionSchema = z.object({
  goal_id: uuid,
  amount: amountSchema,
  currency: currencySchema,
  date: isoDate,
  payment_method: paymentMethodSchema.default("cash"),
});

export const settingsSchema = z.object({
  currency: currencySchema,
  theme: z.enum(["light", "dark", "system"]).default("system"),
  notifications_enabled: z.coerce.boolean().default(true),
  display_name: z.string().trim().max(60).optional(),
  rate_CDF: z.coerce.number().positive().optional(),
  rate_EUR: z.coerce.number().positive().optional(),
  rate_GBP: z.coerce.number().positive().optional(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(6, "6 caractères minimum"),
});

export const signUpSchema = signInSchema.extend({
  display_name: z.string().trim().min(1, "Prénom requis").max(60),
});

/** Turns a zod error into a { field: message } record for forms. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
