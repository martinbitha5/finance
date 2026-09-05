"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Category, Debt, SavingsGoal, Transaction } from "@/lib/finance/types";
import { EXPORT_SCOPES, type ExportScope } from "@/lib/report/scopes";
import { transactionsToCsv, downloadText } from "@/lib/export-csv";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Export professionnel : classeur Excel généré côté serveur (synthèse, transactions,
 * budgets, objectifs, dettes, charges, graphiques natifs) + CSV brut en secours.
 */
export function ExportPanel({
  transactions,
  categories,
  goals,
  debts,
  defaultScope = "month",
  compact,
}: {
  transactions: Transaction[];
  categories: Category[];
  goals: SavingsGoal[];
  debts: Debt[];
  defaultScope?: ExportScope;
  compact?: boolean;
}) {
  const [scope, setScope] = useState<ExportScope>(defaultScope);
  const [busy, setBusy] = useState(false);

  async function downloadExcel() {
    setBusy(true);
    try {
      const res = await fetch(`/api/export?scope=${scope}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Export impossible");
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") ?? "";
      const name = /filename="([^"]+)"/.exec(cd)?.[1] ?? "MONY-rapport.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success("Rapport Excel prêt ✓");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export impossible");
    } finally {
      setBusy(false);
    }
  }

  function downloadCsv() {
    if (transactions.length === 0) return toast.error("Aucune transaction à exporter.");
    downloadText(`MONY-transactions-${new Date().toISOString().slice(0, 10)}.csv`, transactionsToCsv(transactions, categories, goals, debts));
    toast.success(`${transactions.length} transactions exportées en CSV`);
  }

  return (
    <section className="card p-5">
      <CardTitle>{compact ? "Exporter" : "Exporter mes données"}</CardTitle>
      {!compact ? (
        <p className="text-sm text-fg-muted mb-3">
          Un classeur Excel complet et présentable : synthèse avec indicateurs, analyse par catégorie, transactions filtrables, budgets, objectifs, dettes, charges et graphiques.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {EXPORT_SCOPES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setScope(s.value)}
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
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="primary" full onClick={downloadExcel} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Rapport Excel
        </Button>
        <Button variant="secondary" full onClick={downloadCsv}>
          <FileText className="h-4 w-4" /> CSV brut
        </Button>
      </div>
      <p className="text-[11px] text-fg-subtle mt-2">{EXPORT_SCOPES.find((s) => s.value === scope)?.hint} · Excel, Numbers et Google Sheets.</p>
    </section>
  );
}
