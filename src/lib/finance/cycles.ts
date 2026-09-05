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

/** Next occurrence after `from` for a recurring item. */
export function advance(from: Date, frequency: Frequency, dayOfMonth: number | null): Date {
  switch (frequency) {
    case "daily":
      return addDays(from, 1);
    case "weekly":
      return addWeeks(from, 1);
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
export function monthlyEquivalent(amount: number, frequency: Frequency): number {
  switch (frequency) {
    case "daily":
      return amount * 30.44;
    case "weekly":
      return amount * 4.35;
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
  limit = 60,
): string[] {
  const out: string[] = [];
  let cursor = parseISO(nextDate);
  let guard = 0;
  while (guard++ < limit) {
    const iso = toISODate(cursor);
    if (iso >= range.end) break;
    if (iso >= range.start) out.push(iso);
    cursor = advance(cursor, frequency, dayOfMonth);
  }
  return out;
}
