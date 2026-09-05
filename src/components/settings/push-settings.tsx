"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { BellRing, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/actions/push";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/primitives";

type Status = "checking" | "unsupported" | "needs-install" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Notifications push sur cet appareil : abonnement Web Push envoyé au serveur, test d'envoi.
 * iPhone : uniquement quand MONY est installée sur l'écran d'accueil (iOS 16.4+).
 */
export function PushSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [testing, startTest] = useTransition();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const detect = useCallback(async (): Promise<Status> => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      return ios && !standalone ? "needs-install" : "unsupported";
    }
    if (Notification.permission === "denied") return "denied";
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    return sub ? "on" : "off";
  }, []);

  useEffect(() => {
    let active = true;
    detect().then((s) => {
      if (active) setStatus(s);
    });
    return () => {
      active = false;
    };
  }, [detect]);

  async function enable() {
    if (!publicKey) return toast.error("Clés push absentes sur le serveur.");
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return toast.error("Autorisation refusée.");
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const json = sub.toJSON();
      const result = await savePushSubscription({ endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent.slice(0, 300) });
      if (!result.ok) throw new Error(result.error);
      setStatus("on");
      toast.success("Notifications activées sur cet appareil");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Activation impossible");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
      toast.success("Notifications désactivées sur cet appareil");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Désactivation impossible");
    } finally {
      setBusy(false);
    }
  }

  function test() {
    startTest(async () => {
      const r = await sendTestPush();
      if (r.ok) toast.success(`Notification envoyée (${r.data.sent} appareil${r.data.sent > 1 ? "s" : ""})`);
      else toast.error(r.error);
    });
  }

  return (
    <section className="card p-5">
      <CardTitle>Notifications push</CardTitle>
      <p className="text-sm text-fg-muted mb-3">
        Reçois tes alertes directement sur ton téléphone, même quand MONY est fermée : budget presque atteint, dette en retard, salaire qui arrive, objectif atteint.
      </p>

      {status === "checking" ? (
        <p className="text-sm text-fg-subtle inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Vérification…</p>
      ) : status === "needs-install" ? (
        <p className="rounded-2xl bg-info/8 px-4 py-3 text-sm text-fg-muted">
          Sur iPhone, les notifications ne sont possibles qu&apos;une fois MONY installée : Safari → Partager → « Sur l&apos;écran d&apos;accueil », puis ouvre l&apos;app depuis l&apos;icône et reviens ici.
        </p>
      ) : status === "unsupported" ? (
        <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-fg-muted">Ce navigateur ne prend pas en charge les notifications push.</p>
      ) : status === "denied" ? (
        <p className="rounded-2xl bg-negative/8 px-4 py-3 text-sm text-negative">
          Les notifications sont bloquées pour MONY dans les réglages du navigateur. Autorise-les puis recharge la page.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-2xl bg-surface-2/70 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-2xl bg-surface inline-flex items-center justify-center"><BellRing className="h-5 w-5" /></span>
              <div>
                <div className="text-sm font-semibold">Sur cet appareil</div>
                <div className="text-xs text-fg-muted">{status === "on" ? "Activées" : "Désactivées"}</div>
              </div>
            </div>
            {busy ? <Loader2 className="h-5 w-5 animate-spin text-fg-subtle" /> : <Toggle checked={status === "on"} onChange={(v) => (v ? enable() : disable())} label="Notifications push" />}
          </div>
          {status === "on" ? (
            <Button variant="secondary" full className="mt-3" onClick={test} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Envoyer une notification de test
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
