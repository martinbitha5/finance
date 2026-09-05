"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

function detectInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function InstallHint() {
  const mounted = useMounted();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setJustInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mounted) return null;
  const installed = justInstalled || detectInstalled();
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (installed) return <p className="text-sm text-positive font-semibold">✓ MONY est installé sur cet appareil.</p>;

  if (deferred) {
    return (
      <Button
        full
        variant="accent"
        onClick={async () => {
          await deferred.prompt();
          const { outcome } = await deferred.userChoice;
          if (outcome === "accepted") setJustInstalled(true);
          setDeferred(null);
        }}
      >
        <Download className="h-4 w-4" /> Installer sur cet appareil
      </Button>
    );
  }

  return (
    <div className="text-sm text-fg-muted flex flex-col gap-2">
      {isIos ? (
        <p>
          Sur iPhone : ouvre MONY dans Safari, touche <Share className="inline h-4 w-4 align-text-bottom" /> <b>Partager</b>, puis <b>« Sur l&apos;écran d&apos;accueil »</b>.
        </p>
      ) : (
        <p>
          Sur Android : ouvre le menu du navigateur (⋮) puis <b>« Installer l&apos;application »</b> ou <b>« Ajouter à l&apos;écran d&apos;accueil »</b>.
        </p>
      )}
      <p className="text-xs text-fg-subtle">Une fois installée, l&apos;app s&apos;ouvre en plein écran, comme une application native.</p>
    </div>
  );
}
