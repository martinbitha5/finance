"use client";

import { useEffect } from "react";

const TZ_COOKIE = "mony_tz";

/**
 * Registers the service worker and stores the browser timezone in a cookie so that
 * the server computes "today" in the user's calendar day.
 */
export function PwaRegistrar() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && !document.cookie.includes(`${TZ_COOKIE}=${encodeURIComponent(tz)}`)) {
        document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
      }
    } catch {
      /* ignore */
    }
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }
  }, []);
  return null;
}
