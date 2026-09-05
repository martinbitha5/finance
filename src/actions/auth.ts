"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, signInSchema, signUpSchema, verifyCodeSchema } from "@/lib/validation/schemas";
import { parseInput, type ActionResult } from "./_helpers";

async function siteUrl() {
  const h = await headers();
  const origin = h.get("origin") ?? h.get("x-forwarded-host") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return origin.startsWith("http") ? origin : `https://${origin}`;
}

export async function signIn(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = parseInput(signInSchema, input);
  if (!parsed.ok) return parsed;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { ok: false, error: error.message.includes("Invalid") ? "Email ou mot de passe incorrect." : error.message };
  }
  return { ok: true, data: { redirectTo: "/" } };
}

export async function signUp(input: unknown): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = parseInput(signUpSchema, input);
  if (!parsed.ok) return parsed;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.display_name },
      emailRedirectTo: `${await siteUrl()}/auth/callback`,
    },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already registered")) return { ok: false, error: "Un compte existe déjà avec cet email." };
    return { ok: false, error: error.message };
  }
  return { ok: true, data: { needsConfirmation: !data.session } };
}

/** Checks the 6-digit code received by email after sign-up and opens the session. */
export async function verifySignupCode(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = parseInput(verifyCodeSchema, input);
  if (!parsed.ok) return parsed;
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.code, type: "signup" });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("expired") || m.includes("invalid")) {
      return { ok: false, error: "Code incorrect ou expiré.", fields: { code: "Code incorrect ou expiré" } };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true, data: { redirectTo: "/onboarding" } };
}

/** Sends a fresh sign-up code to the same address. */
export async function resendSignupCode(input: unknown): Promise<ActionResult<null>> {
  const parsed = parseInput(emailSchema, input);
  if (!parsed.ok) return parsed;
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data.email });
  if (error) {
    if (error.message.toLowerCase().includes("rate limit") || error.status === 429) {
      return { ok: false, error: "Trop de demandes. Réessaie dans une minute." };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true, data: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
