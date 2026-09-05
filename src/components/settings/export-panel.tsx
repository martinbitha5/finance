"use client";

import { useState, useTransition } from "react";
import { Mail, FileSpreadsheet, FileText, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import type { Category, Debt, SavingsGoal, Transaction } from "@/lib/finance/types";
import { EXPORT_SCOPES, type ExportScope } from "@/lib/report/scopes";
import { emailReport } from "@/actions/export";
import { transactionsToCsv, downloadText } from "@/lib/export-csv";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Export professionnel. Action principale : le rapport (Excel + CSV) est envoyé sur
 * l'adresse e-mail du compte, avec un message de présentation. Le téléchargement direct
 * reste possible en secours.
 */
export function ExportPanel({
  email,
  transactions,
  categories,
  goals,
  debts,
  defaultScope = "month",
  compact,
}: {
  email: string;
  transactions: Transaction[];
  categories: Category[];
  goals: SavingsGoal[];
  debts: Debt[];
  defaultScope?: ExportScope;
  compact?: boolean;
}) {
  const [scope, setScope] = useState<ExportScope>(defaultScope);
  const [sending, startSending] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showDirect, setShowDirect] = useState(false);

  function sendByEmail() {
    startSending(async () => {
      const result = await emailReport(scope);
      if (result.ok) {
        setSentTo(result.data.email);
        toast.success(`Rapport envoyé à ${result.data.email}`);
      } else {
        toast.error(result.error);
        setShowDirect(true);
      }
    });
  }

  async function downloadExcel() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/export?scope=${scope}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Export impossible");
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "MONY-rapport.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export impossible");
    } finally {
      setDownloading(false);
    }
  }

  function downloadCsv() {
    if (transactions.length === 0) return toast.error("Aucune transaction à exporter.");
    downloadText(`MONY-transactions-${new Date().toISOString().slice(0, 10)}.csv`, transactionsToCsv(transactions, categories, goals, debts));
  }

  const scopeInfo = EXPORT_SCOPES.find((s) => s.value === scope);

  return (
    <section className="card p-5">
      <CardTitle>{compact ? "Recevoir mon rapport" : "Recevoir mon rapport par e-mail"}</CardTitle>
      {!compact ? (
        <p className="text-sm text-fg-muted mb-3">
          Tu reçois deux fichiers dans ta boîte mail : le rapport Excel complet (synthèse, analyse par catégorie, transactions, budgets, objectifs, dettes, charges, graphiques) et tes transactions en CSV.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {EXPORT_SCOPES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => { setScope(s.value); setSentTo(null); }}
            title={s.hint}
            className={cn(
              "h-8 px-3 rounded-full text-xs font-semibold press border transition-colors",
              scope === s.value ? "bg-ink text-ink-fg border-ink dark:bg-fg dark:text-bg dark:border-fg" : "bg-surface border-border text-fg-muted hover:text-fg",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Button variant={sentTo ? "secondary" : "primary"} full size="lg" onClick={sendByEmail} disabled={sending}>
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : sentTo ? <Check className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
        {sending ? "Préparation et envoi…" : sentTo ? "Envoyé · renvoyer" : "M'envoyer le rapport par e-mail"}
      </Button>
      <p className="text-[11px] text-fg-subtle mt-2">
        {scopeInfo?.hint} · envoyé à <b className="text-fg-muted">{email}</b> · Excel + CSV en pièces jointes.
      </p>
      {sentTo ? (
        <p className="mt-2 rounded-2xl bg-positive/8 text-positive text-sm px-4 py-2.5 font-semibold">
          ✓ Rapport envoyé à {sentTo}. Vérifie aussi tes spams si tu ne le vois pas d&apos;ici une minute.
        </p>
      ) : null}

      <button type="button" onClick={() => setShowDirect((v) => !v)} className="mt-3 text-xs font-semibold text-fg-muted hover:text-fg underline underline-offset-4">
        {showDirect ? "Masquer le téléchargement direct" : "Télécharger sur cet appareil plutôt"}
      </button>
      {showDirect ? (
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <Button variant="secondary" full onClick={downloadExcel} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Rapport Excel
          </Button>
          <Button variant="secondary" full onClick={downloadCsv}>
            <FileText className="h-4 w-4" /> CSV brut
          </Button>
        </div>
      ) : null}
    </section>
  );
}
