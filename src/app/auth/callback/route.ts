import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Exchanges the code from the email confirmation / magic link for a session. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/"}`);
  }
  return NextResponse.redirect(`${origin}/login?error=lien-invalide`);
}
