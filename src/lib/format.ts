import { CURRENCIES, type Currency } from "./constants";
import { format, isToday, isYesterday, parseISO, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";

const info = (code: Currency) => CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];

/** Formats an amount in the given currency, e.g. "223,00 $" or "12 500 FC". */
export function formatMoney(
  amount: number,
  currency: Currency = "USD",
  opts: { compact?: boolean; sign?: boolean; decimals?: number } = {},
) {
  const { symbol, decimals } = info(currency);
  const d = opts.decimals ?? decimals;
  const abs = Math.abs(amount);
  let body: string;
  if (opts.compact && abs >= 10000) {
    body = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1, notation: "compact" }).format(abs);
  } else {
    body = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(abs);
  }
  const sign = amount < 0 ? "-" : opts.sign && amount > 0 ? "+" : "";
  return `${sign}${body} ${symbol}`;
}

/** Splits an amount into integer and fraction parts for large hero displays. */
export function splitMoney(amount: number, currency: Currency = "USD") {
  const { symbol, decimals } = info(currency);
  const abs = Math.abs(amount);
  const int = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.floor(abs));
  const frac = decimals > 0 ? (abs - Math.floor(abs)).toFixed(decimals).slice(1) : "";
  return { sign: amount < 0 ? "-" : "", int, frac, symbol };
}

export function currencySymbol(currency: Currency) {
  return info(currency).symbol;
}

export function formatPercent(value: number, digits = 0) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(value)} %`;
}

export function toISODate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function formatDate(iso: string | Date, pattern = "d MMM yyyy") {
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  return format(d, pattern, { locale: fr });
}

export function formatDayLabel(iso: string) {
  const d = parseISO(iso);
  if (isToday(d)) return "Aujourd'hui";
  if (isYesterday(d)) return "Hier";
  if (isTomorrow(d)) return "Demain";
  return format(d, "EEEE d MMMM", { locale: fr });
}

export function formatMonth(d: Date) {
  const s = format(d, "MMMM yyyy", { locale: fr });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function pluralDays(n: number) {
  return `${n} jour${n > 1 ? "s" : ""}`;
}
