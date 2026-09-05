import { cookies } from "next/headers";
import { todayInTimezone } from "@/lib/today";

export const TZ_COOKIE = "mony_tz";

/**
 * "Today" as seen by the user. The browser stores its IANA timezone in a cookie so that
 * server-side calculations (posting due recurring expenses) use the user's calendar day, not the server's.
 */
export async function getToday(): Promise<Date> {
  const store = await cookies();
  const tz = store.get(TZ_COOKIE)?.value || "UTC";
  return todayInTimezone(tz);
}

export { todayInTimezone };
