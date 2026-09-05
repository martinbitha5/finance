"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** true after hydration on the client, false during SSR — without setState in an effect. */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
