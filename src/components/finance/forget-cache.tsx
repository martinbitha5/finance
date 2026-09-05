"use client";

import { useEffect } from "react";
import { forgetFinanceCache } from "./finance-provider";

/** Mounted on the auth pages: whoever lands here is signed out, so drop the on-device data. */
export function ForgetFinanceCache() {
  useEffect(() => {
    forgetFinanceCache();
  }, []);
  return null;
}
