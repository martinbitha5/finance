import { cookies } from "next/headers";
import { parseISO } from "date-fns";

export const TZ_COOKIE = "mony_tz";

/**
 * "Today" as seen by the user. The browser stores its IANA timezone in a cookie so that
 * server-side calculations (daily allowance, cycles) use the user's calendar day, not the server's.
 */
export async function getToday(): Promise<Date> {
  const store = await cookies();
  const tz = store.get(TZ_COOKIE)?.value || "UTC";
  return todayInTimezone(tz);
}

export function todayInTimezone(tz: string): Date {
  let iso: string;
  try {
    iso = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    iso = new Date().toISOString().slice(0, 10);
  }
  return parseISO(iso);
}
