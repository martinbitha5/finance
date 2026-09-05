import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadFinanceRawForUser } from "@/services/finance-data";
import { buildFinanceData } from "@/lib/finance/data";
import { syncNotifications } from "@/services/notifications-sync";
import { todayInTimezone } from "@/lib/today";
import { toISODate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron quotidien (vercel.json) : calcule les alertes de chaque utilisateur abonné aux push
 * et les envoie même quand l'app est fermée. Poste au passage les charges récurrentes dues,
 * comme le ferait l'ouverture de l'app. Idempotent (dédoublonnage par cycle de paie).
 *
 * Auth : si CRON_SECRET est défini, l'en-tête `Authorization: Bearer <CRON_SECRET>` est exigé
 * (Vercel l'ajoute automatiquement à ses crons). Sinon, on accepte le user-agent vercel-cron.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const fromVercelCron = (request.headers.get("user-agent") ?? "").includes("vercel-cron");
  if (secret ? auth !== `Bearer ${secret}` : !fromVercelCron) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SECRET_KEY manquante" }, { status: 500 });

  // Le cron tourne tôt le matin : la date UTC correspond à la date locale des utilisateurs.
  const today = todayInTimezone("UTC");
  const todayISO = toISODate(today);

  // Seuls les utilisateurs ayant au moins un appareil abonné peuvent recevoir un push.
  const { data: subs, error } = await admin.from("push_subscriptions").select("user_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const userIds = [...new Set((subs ?? []).map((s) => s.user_id))];

  let ok = 0;
  const failures: string[] = [];
  for (const userId of userIds) {
    try {
      const raw = await loadFinanceRawForUser(admin, userId, null, todayISO);
      if (!raw) continue;
      const { summary } = buildFinanceData(raw, today);
      await syncNotifications(admin, userId, summary, raw.settings.notifications_enabled);
      ok += 1;
    } catch (e) {
      failures.push(`${userId}: ${e instanceof Error ? e.message : "erreur"}`);
    }
  }
  return NextResponse.json({ users: userIds.length, ok, failures });
}
