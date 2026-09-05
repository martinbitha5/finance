"use client";

import { useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { clearDemoData, loadDemoData } from "@/actions/demo";
import { useAction } from "@/hooks/use-action";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/ui/sheet";

export function DemoButton({ loaded, variant = "secondary", full }: { loaded: boolean; variant?: ButtonProps["variant"]; full?: boolean }) {
  const load = useAction(loadDemoData, { success: "Données de démonstration chargées ✨" });
  const clear = useAction(clearDemoData, { success: "Données de démonstration supprimées" });
  const [confirm, setConfirm] = useState(false);

  if (loaded) {
    return (
      <>
        <Button variant="danger" full={full} loading={clear.pending} onClick={() => setConfirm(true)}>
          <Trash2 className="h-4 w-4" /> Effacer les données de démo
        </Button>
        <ConfirmSheet
          open={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={async () => {
            await clear.execute(null);
            setConfirm(false);
          }}
          loading={clear.pending}
          title="Effacer la démo ?"
          description="Toutes les données marquées comme démonstration seront supprimées. Tes propres données restent intactes."
          confirmLabel="Effacer"
        />
      </>
    );
  }
  return (
    <Button variant={variant} full={full} loading={load.pending} onClick={() => load.execute(null)}>
      <Sparkles className="h-4 w-4" /> Charger les données de démonstration
    </Button>
  );
}
