"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FinanceSummary } from "@/lib/finance/types";
import { formatMoney, formatDate } from "@/lib/format";
import { Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function DailyAllowanceCard({ s, expanded = false }: { s: FinanceSummary; expanded?: boolean }) {
  const [open, setOpen] = useState(expanded);
  const cur = s.currency;
  const spentPct = s.dailyAllowance + s.todaySpent > 0 ? (s.todaySpent / (s.dailyAllowance + s.todaySpent)) * 100 : 0;
  const tone = s.safeToSpend < 0 ? "negative" : s.paceRatio !== null && s.paceRatio >= 1.25 ? "warning" : "positive";

  const rows: { label: string; value: number; strong?: boolean; muted?: boolean }[] = [
    { label: "Solde actuel", value: s.balance },
    { label: "Charges restantes", value: -s.remainingCharges, muted: true },
    { label: "Épargne protégée", value: -s.remainingSavings, muted: true },
    { label: "Argent disponible", value: s.safeToSpend, strong: true },
  ];

  return (
    <section className="card p-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-12 w-12 rounded-2xl inline-flex items-center justify-center text-2xl shrink-0",
            tone === "positive" && "bg-positive/12",
            tone === "warning" && "bg-warning/15",
            tone === "negative" && "bg-negative/12",
          )}
        >
          💵
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-fg-muted">Aujourd&apos;hui</p>
          {s.safeToSpend >= 0 ? (
            <p className="text-lg font-extrabold tracking-tight leading-snug">
              Tu peux dépenser environ <span className="tabular whitespace-nowrap">{formatMoney(s.dailyAllowance, cur)}</span>
            </p>
          ) : (
            <p className="text-lg font-extrabold tracking-tight leading-snug text-negative">
              Tes charges dépassent ton solde de <span className="tabular whitespace-nowrap">{formatMoney(Math.abs(s.safeToSpend), cur)}</span>
            </p>
          )}
          <p className="text-xs text-fg-subtle mt-0.5">
            {s.dailyAllowance > 0
              ? `${formatMoney(s.dailyAllowance, cur)} × ${s.cycle.daysRemaining} jours jusqu'au ${formatDate(s.cycle.nextPayday, "d MMM")}`
              : "Aucune marge : chaque dépense creuse le déficit."}
          </p>
        </div>
      </div>

      {s.todaySpent > 0 ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-fg-muted">Dépensé aujourd&apos;hui</span>
            <span className="tabular">{formatMoney(s.todaySpent, cur)}</span>
          </div>
          <Progress value={spentPct} color={spentPct >= 100 ? "var(--negative)" : "var(--fg)"} size="sm" />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 w-full flex items-center justify-between text-[13px] font-semibold text-fg-muted hover:text-fg"
        aria-expanded={open}
      >
        Comment c&apos;est calculé ?
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-3 rounded-2xl bg-surface-2/70 p-4 text-sm animate-fade-in">
          {s.salary.configured ? (
            <div className="flex justify-between py-1.5 text-fg-muted">
              <span>Salaire</span>
              <span className="tabular">{formatMoney(s.salary.amount, cur)}</span>
            </div>
          ) : null}
          {rows.map((r) => (
            <div key={r.label} className={cn("flex justify-between py-1.5", r.strong ? "font-bold border-t border-border mt-1 pt-2.5" : r.muted ? "text-fg-muted" : "")}>
              <span>{r.label}</span>
              <span className={cn("tabular", r.strong && r.value < 0 && "text-negative")}>{formatMoney(r.value, cur, { sign: false })}</span>
            </div>
          ))}
          <div className="flex justify-between py-1.5 text-fg-muted">
            <span>Jours avant prochaine paie</span>
            <span className="tabular">{s.cycle.daysRemaining}</span>
          </div>
          <div className="flex justify-between py-1.5 font-bold">
            <span>Par jour</span>
            <span className="tabular">{formatMoney(s.dailyAllowance, cur)}</span>
          </div>
          {s.avgDailySpend > 0 ? (
            <p className="mt-2 text-xs text-fg-subtle">
              Ton rythme actuel : {formatMoney(s.avgDailySpend, cur)}/jour hors charges fixes.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
