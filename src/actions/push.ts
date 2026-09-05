"use server";

import { z } from "zod";
import { requireUser, type ActionResult } from "./_helpers";
import { isPushConfigured, sendPushToUser } from "@/lib/push/server";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({ p256dh: z.string().min(10).max(500), auth: z.string().min(5).max(200) }),
  userAgent: z.string().max(300).optional(),
});

/** Enregistre (ou met à jour) l'abonnement push de cet appareil. */
export async function savePushSubscription(input: unknown): Promise<ActionResult<null>> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Abonnement invalide" };
  try {
    const { supabase, user } = await requireUser();
    const { endpoint, keys, userAgent } = parsed.data;
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({ user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, user_agent: userAgent ?? null }, { onConflict: "endpoint" });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult<null>> {
  if (typeof endpoint !== "string" || endpoint.length > 2000) return { ok: false, error: "Abonnement invalide" };
  try {
    const { supabase, user } = await requireUser();
    await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

/** Envoie une notification de test sur tous les appareils abonnés de l'utilisateur. */
export async function sendTestPush(): Promise<ActionResult<{ sent: number }>> {
  if (!isPushConfigured()) return { ok: false, error: "Les notifications push ne sont pas configurées sur ce serveur (clés VAPID)." };
  try {
    const { supabase, user } = await requireUser();
    const sent = await sendPushToUser(supabase, user.id, {
      title: "MONY · notification de test",
      body: "Tout fonctionne : tu recevras ici tes alertes budget, dettes, salaire et épargne.",
      url: "/notifications",
      tag: "mony-test",
    });
    if (sent === 0) return { ok: false, error: "Aucun appareil abonné n'a pu être joint. Réactive les notifications puis réessaie." };
    return { ok: true, data: { sent } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}
