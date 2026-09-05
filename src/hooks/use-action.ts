"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/actions/_helpers";
import { useFinanceOptional } from "@/components/finance/finance-provider";

/**
 * Runs a server action with pending state, toast feedback and field errors.
 * Returns the action result so callers can close sheets / reset forms on success.
 *
 * Mutating actions return the user's fresh rows (`result.finance`); they are pushed straight
 * into the finance store, so the UI updates in the same round-trip with no extra request.
 * Pass `refresh: true` only for actions outside the store (auth) that need a router refresh.
 */
export function useAction<TInput, TData>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  opts: { success?: string; refresh?: boolean; onSuccess?: (data: TData) => void; onError?: (error: string) => void } = {},
) {
  const [pending, startTransition] = useTransition();
  const [fields, setFields] = useState<Record<string, string>>({});
  const router = useRouter();
  const store = useFinanceOptional();

  const execute = useCallback(
    (input: TInput) =>
      new Promise<ActionResult<TData>>((resolve) => {
        startTransition(async () => {
          const result = await action(input);
          if (result.ok) {
            setFields({});
            if (result.finance) store?.setRaw(result.finance);
            if (opts.success) toast.success(opts.success);
            if (opts.refresh) router.refresh();
            opts.onSuccess?.(result.data);
          } else {
            setFields(result.fields ?? {});
            toast.error(result.error);
            opts.onError?.(result.error);
          }
          resolve(result);
        });
      }),
    [action, opts, router, store],
  );

  return { execute, pending, fields, setFields };
}
