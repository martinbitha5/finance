import { parseISO } from "date-fns";

/** The calendar day in the given IANA timezone, as a local Date at midnight. Isomorphic. */
export function todayInTimezone(tz: string): Date {
  let iso: string;
  try {
    iso = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    iso = new Date().toISOString().slice(0, 10);
  }
  return parseISO(iso);
}

/** The device's own calendar day (browser). */
export function deviceToday(): Date {
  let tz = "UTC";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    /* ignore */
  }
  return todayInTimezone(tz);
}
