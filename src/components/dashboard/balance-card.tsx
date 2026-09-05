"use client";

import Link from "next/link";
import { CalendarClock, PiggyBank, ShieldCheck } from "lucide-react";
import type { FinanceSummary } from "@/lib/finance/types";
import { formatMoney, splitMoney, formatDate } from "@/lib/format";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

export function BalanceCard({ s }: { s: FinanceSummary }) {
  const animated = useCountUp(s.balance);
  const { sign, int, frac, symbol } = splitMoney(animated, s.currency);
  const negative = s.balance < 0;

  return (
    <section className="aurora relative overflow-hidden rounded-4xl p-6 text-ink-fg shadow-float animate-fade-up">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" aria-hidden />
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted">Solde disponible</div>
      <div className={cn("mt-2 flex items-baseline gap-1 tabular", negative && "text-negative")}>
        <span className="text-[44px] leading-none font-extrabold tracking-tight">
          {sign}
          {int}
        </span>
        {frac ? <span className="text-2xl font-bold opacity-80">{frac}</span> : null}
        <span className="ml-1 text-2xl font-bold text-ink-muted">{symbol}</span>
      </div>

      <div className="mt-3 text-sm text-ink-muted">
        {s.salary.configured ? (
          s.cycle.salaryReceived > 0 ? (
            <>
              Salaire reçu : <b className="text-ink-fg tabular">{formatMoney(s.cycle.salaryReceived, s.currency)}</b>
            </>
          ) : s.cycle.daysElapsed <= 7 && !s.cycle.isCalendarMonth ? (
            <Link href="/ajouter?type=income" className="underline underline-offset-4 decoration-ink-muted">
              Salaire du {formatDate(s.cycle.start, "d MMMM")} non enregistré · l&apos;ajouter →
            </Link>
          ) : (
            <>
              Salaire attendu : <b className="text-ink-fg tabular">{formatMoney(s.salary.amount, s.currency)}</b> le {formatDate(s.cycle.nextPayday, "d MMMM")}
            </>
          )
        ) : (
          <Link href="/revenus" className="underline underline-offset-4">
            Configure ton salaire pour des prévisions précises →
          </Link>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
          <CalendarClock className="h-3.5 w-3.5" />
          {s.salary.configured ? `Paie dans ${s.cycle.daysRemaining} j` : `${s.cycle.daysRemaining} j restants ce mois`}
        </span>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur", s.safeToSpend >= 0 ? "bg-white/10" : "bg-negative/30")}>
          <ShieldCheck className="h-3.5 w-3.5" />
          Libre : <span className="tabular">{formatMoney(s.safeToSpend, s.currency)}</span>
        </span>
        {s.savings.total > 0 ? (
          <Link
            href="/objectifs"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/15"
            title="Argent mis de côté, non compté dans le solde disponible"
          >
            <PiggyBank className="h-3.5 w-3.5" />
            Épargné : <span className="tabular">{formatMoney(s.savings.total, s.currency)}</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
