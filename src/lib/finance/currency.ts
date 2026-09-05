import { CURRENCIES, DEFAULT_RATES, type Currency } from "@/lib/constants";
import type { Json } from "@/lib/supabase/database.types";
import { round2 } from "@/lib/utils";

/** Normalizes the jsonb exchange_rates column into a full rate table (units per 1 USD). */
export function normalizeRates(raw: Json | null | undefined): Record<Currency, number> {
  const out = { ...DEFAULT_RATES };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const c of CURRENCIES) {
      const v = (raw as Record<string, unknown>)[c.code];
      if (typeof v === "number" && Number.isFinite(v) && v > 0) out[c.code] = v;
    }
  }
  out.USD = 1;
  return out;
}

/** Converts between currencies using a USD-based rate table. */
export function convert(amount: number, from: Currency, to: Currency, rates: Record<Currency, number>) {
  if (from === to) return amount;
  const inUsd = amount / (rates[from] || 1);
  return round2(inUsd * (rates[to] || 1));
}

/** Human-readable rate between two currencies, e.g. "1 USD = 2 850 FC". */
export function describeRate(from: Currency, to: Currency, rates: Record<Currency, number>) {
  const r = convert(1, from, to, rates);
  const digits = r >= 100 ? 0 : 4;
  return `1 ${from} = ${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(r)} ${to}`;
}
