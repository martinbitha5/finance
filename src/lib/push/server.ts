import "server-only";
import webpush from "web-push";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface PushPayload {
  title: string;
  body?: string;
  /** Écran ouvert au clic (chemin relatif). */
  url?: string;
  /** Regroupe les notifications de même sujet. */
  tag?: string;
}

export function isPushConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let configured = false;
function ensureVapid() {
  if (configured) return true;
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contact@example.com", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
  return true;
}

/**
 * Envoie une notification push à tous les appareils abonnés de l'utilisateur.
 * Les abonnements expirés (404 / 410) sont supprimés au passage.
 * Renvoie le nombre d'envois réussis.
 */
export async function sendPushToUser(supabase: Supabase, userId: string, payload: PushPayload): Promise<number> {
  if (!ensureVapid()) return 0;
  const { data: subs } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  if (!subs || subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  let sent = 0;
  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 60 * 60 * 24, urgency: "normal" });
        sent += 1;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(s.id);
        else console.error("[push] envoi échoué", status, (e as Error).message);
      }
    }),
  );
  if (dead.length) await supabase.from("push_subscriptions").delete().in("id", dead);
  if (sent) await supabase.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("user_id", userId);
  return sent;
}
