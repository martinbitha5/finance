"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/actions/_helpers";

/**
 * Runs a server action with pending state, toast feedback and field errors.
 * Returns the action result so callers can close sheets / reset forms on success.
 *
 * Actions that call `revalidateApp()` already return the re-rendered tree in the same
 * round-trip, so no `router.refresh()` is issued by default (it would re-run every query a
 * second time). Pass `refresh: true` only for actions that do not revalidate themselves.
 */
export function useAction<TInput, TData>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  opts: { success?: string; refresh?: boolean; onSuccess?: (data: TData) => void } = {},
) {
  const [pending, startTransition] = useTransition();
  const [fields, setFields] = useState<Record<string, string>>({});
  const router = useRouter();

  const execute = useCallback(
    (input: TInput) =>
      new Promise<ActionResult<TData>>((resolve) => {
        startTransition(async () => {
          const result = await action(input);
          if (result.ok) {
            setFields({});
            if (opts.success) toast.success(opts.success);
            if (opts.refresh) router.refresh();
            opts.onSuccess?.(result.data);
          } else {
            setFields(result.fields ?? {});
            toast.error(result.error);
          }
          resolve(result);
        });
      }),
    [action, opts, router],
  );

  return { execute, pending, fields, setFields };
}
