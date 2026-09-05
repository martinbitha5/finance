"use client";

import { useEffect } from "react";

const TZ_COOKIE = "mony_tz";

/**
 * Registers the service worker (offline shell + Web Push) and stores the browser timezone in a
 * cookie so that the server computes "today" in the user's calendar day.
 * Registered in development too: push notifications need the worker to be installed.
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
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }
  }, []);
  return null;
}
