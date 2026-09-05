"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { fetchFinance } from "@/actions/finance";
import { buildFinanceData, type FinanceData, type FinanceRaw } from "@/lib/finance/data";
import { deviceToday } from "@/lib/today";
import { toISODate } from "@/lib/format";

/** Bump when the shape of FinanceRaw changes, so stale device caches are ignored. */
const CACHE_KEY = "mony:finance:v1";
/** Data older than this is refreshed when the app comes back to the foreground. */
const STALE_MS = 60_000;
/** Never persist more than this on the device (localStorage is ~5 MB). */
const MAX_CACHE_BYTES = 4_000_000;

export type FinanceStatus = "loading" | "cached" | "fresh" | "offline";

export interface FinanceStore {
  /** Computed data for the device's calendar day, or null before the first load. */
  data: FinanceData | null;
  raw: FinanceRaw | null;
  status: FinanceStatus;
  /** Pulls fresh rows from the server (deduplicated while one is in flight). */
  refresh: () => Promise<void>;
  /** Replaces the rows, e.g. with the fresh copy a mutation returned. */
  setRaw: (raw: FinanceRaw) => void;
  /** Applies a local change immediately (optimistic UI); the next server response wins. */
  patch: (fn: (raw: FinanceRaw) => FinanceRaw) => void;
}

const Ctx = createContext<FinanceStore | null>(null);

function readCache(): FinanceRaw | null {
  try {
    const json = localStorage.getItem(CACHE_KEY);
    if (!json) return null;
    const parsed = JSON.parse(json) as FinanceRaw;
    return parsed && typeof parsed === "object" && parsed.userId && parsed.settings ? parsed : null;
  } catch {
    return null;
  }
}

/** The device copy, read once per page load (stable reference for useSyncExternalStore). */
let bootCache: FinanceRaw | null | undefined;
const getBootCache = () => (bootCache === undefined ? (bootCache = readCache()) : bootCache);
const getServerBootCache = () => null;
const subscribeNoop = () => () => {};

function writeCache(raw: FinanceRaw) {
  try {
    const json = JSON.stringify(raw);
    if (json.length > MAX_CACHE_BYTES) return;
    localStorage.setItem(CACHE_KEY, json);
  } catch {
    /* quota exceeded or storage disabled: the app simply works without the device cache */
  }
}

/** Removes the on-device copy (sign-out, session lost, another account). */
export function forgetFinanceCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Holds the user's finance data in memory and on the device.
 *
 * - First paint comes from the device cache (instant), then the server copy replaces it.
 * - Every screen computes what it shows from this store: navigation never waits for the network.
 * - Mutations return fresh rows in the same round-trip; optimistic patches make them feel instant.
 */
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Server render / first client paint: null on the server, the device copy in the browser.
  const cached = useSyncExternalStore(subscribeNoop, getBootCache, getServerBootCache);
  const [fresh, setFresh] = useState<FinanceRaw | null>(null);
  const [failed, setFailed] = useState(false);
  const [todayISO, setTodayISO] = useState(() => toISODate(deviceToday()));
  const inFlight = useRef<Promise<void> | null>(null);
  const rawRef = useRef<FinanceRaw | null>(null);

  const raw = fresh ?? cached;
  const status: FinanceStatus = fresh ? "fresh" : cached ? "cached" : failed ? "offline" : "loading";

  useEffect(() => {
    rawRef.current = raw;
  }, [raw]);

  const setRaw = useCallback((next: FinanceRaw) => {
    setFresh(next);
    setFailed(false);
    writeCache(next);
  }, []);

  const patch = useCallback((fn: (r: FinanceRaw) => FinanceRaw) => {
    setFresh((current) => {
      const base = current ?? rawRef.current;
      if (!base) return current;
      const next = fn(base);
      writeCache(next);
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    const p = (async () => {
      try {
        const next = await fetchFinance();
        if (!next) {
          forgetFinanceCache();
          router.replace("/login");
          return;
        }
        setRaw(next);
      } catch {
        // Offline or server unreachable: keep whatever we have.
        setFailed(true);
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = p;
    return p;
  }, [router, setRaw]);

  // Boot: the device copy is already on screen (if any); get the server copy.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Coming back to the app (PWA resumed, tab focused) or back online: revalidate if stale.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      setTodayISO(toISODate(deviceToday()));
      const loadedAt = rawRef.current ? Date.parse(rawRef.current.loadedAt) : 0;
      if (Date.now() - loadedAt > STALE_MS) void refresh();
    };
    const onOnline = () => void refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh]);

  const data = useMemo(() => (raw ? buildFinanceData(raw, deviceToday()) : null), [raw, todayISO]); // eslint-disable-line react-hooks/exhaustive-deps

  // Onboarding gate (used to be a server redirect in the layout).
  useEffect(() => {
    if (data && !data.profile.onboarding_completed) router.replace("/onboarding");
  }, [data, router]);

  const value = useMemo<FinanceStore>(() => ({ data, raw, status, refresh, setRaw, patch }), [data, raw, status, refresh, setRaw, patch]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The store, or null outside the app shell (auth pages). */
export function useFinanceOptional() {
  return useContext(Ctx);
}

export function useFinance(): FinanceStore {
  const store = useContext(Ctx);
  if (!store) throw new Error("useFinance must be used inside <FinanceProvider>");
  return store;
}

/** Computed data, guaranteed present: screens must be rendered inside <FinanceGate>. */
export function useFinanceData(): FinanceData {
  const { data } = useFinance();
  if (!data) throw new Error("useFinanceData used before data was loaded (wrap the screen in <FinanceGate>)");
  return data;
}
