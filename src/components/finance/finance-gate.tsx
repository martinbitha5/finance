"use client";

import { WifiOff } from "lucide-react";
import { useFinance } from "./finance-provider";
import { AppSkeleton } from "@/components/layout/app-skeleton";
import { Button } from "@/components/ui/button";

/** Renders the screen once data exists; a skeleton (or an offline notice) before that. */
export function FinanceGate({ children }: { children: React.ReactNode }) {
  const { data, status, refresh } = useFinance();
  if (data) return <>{children}</>;
  if (status === "offline") {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center text-center gap-3 px-6">
        <WifiOff className="h-8 w-8 text-fg-subtle" />
        <h2 className="font-bold text-lg">Pas de connexion</h2>
        <p className="text-sm text-fg-muted max-w-xs text-balance">
          MONY a besoin d&apos;internet pour la première ouverture. Ensuite, tes données restent sur ton téléphone.
        </p>
        <Button variant="secondary" onClick={() => void refresh()}>
          Réessayer
        </Button>
      </div>
    );
  }
  return <AppSkeleton />;
}
