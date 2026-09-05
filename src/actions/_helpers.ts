import "server-only";
import type { z } from "zod";
import { createClient, getUser } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/validation/schemas";
import { loadFinanceRaw } from "@/services/finance-data";
import type { FinanceRaw } from "@/lib/finance/data";

export type ActionResult<T = null> =
  | {
      ok: true;
      data: T;
      /** Fresh rows after the mutation, so the device updates in the same round-trip. */
      finance?: FinanceRaw;
    }
  | { ok: false; error: string; fields?: Record<string, string> };

export async function requireUser() {
  const [supabase, user] = await Promise.all([createClient(), getUser()]);
  if (!user) throw new Error("Non authentifié");
  return { supabase, user };
}

export function parseInput<S extends z.ZodTypeAny>(
  schema: S,
  input: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; error: string; fields: Record<string, string> } {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields = fieldErrors(result.error);
    return { ok: false, error: Object.values(fields)[0] ?? "Données invalides", fields };
  }
  return { ok: true, data: result.data };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

/**
 * Wraps a mutating action with uniform error handling and, on success, reloads the user's
 * rows so the client store can replace its data without a second request.
 */
export async function run<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    const result = await fn();
    if (!result.ok) return result;
    const finance = await loadFinanceRaw();
    return finance ? { ...result, finance } : result;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Une erreur est survenue";
    return { ok: false, error: message };
  }
}
