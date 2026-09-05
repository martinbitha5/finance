import {
  addMonths,
  addDays,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  getDaysInMonth,
  isAfter,
  parseISO,
  setDate,
  startOfMonth,
  subMonths,
} from "date-fns";
import type { PayCycle, DateRange } from "./types";
import type { Frequency } from "@/lib/constants";
import { toISODate } from "@/lib/format";

/** Returns the date of `payDay` in the month of `ref`, clamped to the month length. */
export function paydayInMonth(ref: Date, payDay: number) {
  return setDate(startOfMonth(ref), Math.min(payDay, getDaysInMonth(ref)));
}

/**
 * The current pay cycle: from the last payday (inclusive) to the next payday (exclusive).
 * Without a payday, the calendar month is used.
 */
export function getPayCycle(today: Date, payDay: number | null): PayCycle {
  let start: Date;
  let end: Date;
  let isCalendarMonth = false;

  if (payDay && payDay >= 1 && payDay <= 31) {
    end = paydayInMonth(today, payDay);
    if (!isAfter(end, today)) end = paydayInMonth(addMonths(today, 1), payDay);
    start = paydayInMonth(subMonths(end, 1), payDay);
  } else {
    isCalendarMonth = true;
    start = startOfMonth(today);
    end = addMonths(start, 1);
  }

  const daysTotal = Math.max(1, differenceInCalendarDays(end, start));
  const daysElapsed = Math.max(1, differenceInCalendarDays(today, start) + 1);
  const daysRemaining = Math.max(1, differenceInCalendarDays(end, today));

  return {
    start: toISODate(start),
    end: toISODate(end),
    nextPayday: toISODate(end),
    isCalendarMonth,
    daysTotal,
    daysElapsed,
    daysRemaining,
  };
}

export function monthRange(ref: Date): DateRange {
  const start = startOfMonth(ref);
  return { start: toISODate(start), end: toISODate(addMonths(start, 1)) };
}

export function inRange(date: string, range: DateRange) {
  return date >= range.start && date < range.end;
}

/** ISO weekday of a date: 1 = lundi … 7 = dimanche. */
export function isoWeekday(d: Date): number {
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

export const WEEKDAYS: { value: number; short: string; label: string }[] = [
  { value: 1, short: "L", label: "Lundi" },
  { value: 2, short: "M", label: "Mardi" },
  { value: 3, short: "M", label: "Mercredi" },
  { value: 4, short: "J", label: "Jeudi" },
  { value: 5, short: "V", label: "Vendredi" },
  { value: 6, short: "S", label: "Samedi" },
  { value: 7, short: "D", label: "Dimanche" },
];

/** Normalises a weekday selection: unique, sorted, within 1..7; null when empty. */
export function normalizeWeekdays(weekdays: number[] | null | undefined): number[] | null {
  if (!weekdays) return null;
  const set = [...new Set(weekdays.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b);
  return set.length ? set : null;
}

/** First date ≥ `date` whose weekday belongs to the selection (the date itself if it matches). */
export function alignToWeekdays(date: Date, weekdays: number[] | null): Date {
  const set = normalizeWeekdays(weekdays);
  if (!set) return date;
  let d = date;
  for (let i = 0; i < 7; i += 1) {
    if (set.includes(isoWeekday(d))) return d;
    d = addDays(d, 1);
  }
  return date;
}

/** Human label of a weekday selection: "Lun. → Sam.", "Lun., Mer., Ven.", "Tous les jours"… */
export function describeWeekdays(weekdays: number[] | null | undefined): string | null {
  const set = normalizeWeekdays(weekdays);
  if (!set) return null;
  if (set.length === 7) return "Tous les jours";
  const short = (v: number) => WEEKDAYS[v - 1]!.label.slice(0, 3) + ".";
  const contiguous = set.every((v, i) => i === 0 || v === set[i - 1]! + 1);
  if (contiguous && set.length >= 3) return `${short(set[0]!)} → ${short(set[set.length - 1]!)}`;
  return set.map(short).join(", ");
}

/** Next occurrence after `from` for a recurring item. */
export function advance(from: Date, frequency: Frequency, dayOfMonth: number | null, weekdays: number[] | null = null): Date {
  switch (frequency) {
    case "daily":
      return addDays(from, 1);
    case "weekly": {
      const set = normalizeWeekdays(weekdays);
      if (!set) return addWeeks(from, 1);
      // Several weekdays: the next selected day strictly after `from`.
      return alignToWeekdays(addDays(from, 1), set);
    }
    case "yearly":
      return addYears(from, 1);
    case "monthly":
    default: {
      const next = addMonths(startOfMonth(from), 1);
      const day = dayOfMonth ?? from.getDate();
      return setDate(next, Math.min(day, getDaysInMonth(next)));
    }
  }
}

/** Average monthly cost of a recurring amount (30.44 days / 4.35 weeks per month). */
export function monthlyEquivalent(amount: number, frequency: Frequency, weekdays: number[] | null = null): number {
  switch (frequency) {
    case "daily":
      return amount * 30.44;
    case "weekly":
      return amount * 4.35 * (normalizeWeekdays(weekdays)?.length ?? 1);
    case "yearly":
      return amount / 12;
    case "monthly":
    default:
      return amount;
  }
}

/** All occurrences of a recurring item within [rangeStart, rangeEnd), starting at `nextDate`. */
export function occurrencesInRange(
  nextDate: string,
  frequency: Frequency,
  dayOfMonth: number | null,
  range: DateRange,
  weekdays: number[] | null = null,
  limit = 400,
): string[] {
  const out: string[] = [];
  const set = frequency === "weekly" ? normalizeWeekdays(weekdays) : null;
  let cursor = set ? alignToWeekdays(parseISO(nextDate), set) : parseISO(nextDate);
  let guard = 0;
  while (guard++ < limit) {
    const iso = toISODate(cursor);
    if (iso >= range.end) break;
    if (iso >= range.start) out.push(iso);
    cursor = advance(cursor, frequency, dayOfMonth, set);
  }
  return out;
}
