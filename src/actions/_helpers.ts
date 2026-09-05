import "server-only";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient, getUser } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/validation/schemas";

export type ActionResult<T = null> =
  | { ok: true; data: T }
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

export function revalidateApp() {
  revalidatePath("/", "layout");
}

/** Wraps an action body with uniform error handling. */
export async function run<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Une erreur est survenue";
    return { ok: false, error: message };
  }
}
