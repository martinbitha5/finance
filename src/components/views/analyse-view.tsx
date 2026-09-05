"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { SpendingBreakdown } from "@/components/dashboard/spending-breakdown";
import { InsightsList } from "@/components/dashboard/insights-list";
import { DailyAllowanceCard } from "@/components/dashboard/daily-allowance-card";
import { DailyBars, TrendBars } from "@/components/charts/trend-bars";
import { CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/primitives";
import { BrandLogo } from "@/components/ui/brand-logo";
import { brandFor } from "@/lib/finance/brands";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AnalyseView() {
  const { summary: s, snapshot } = useFinanceData();
  const cur = s.currency;
  const pace = s.paceRatio;
  const paceTone = pace === null ? "neutral" : pace >= 1.25 ? "negative" : pace >= 1 ? "warning" : "positive";
  const incomeRef = s.month.income || s.salary.amount;

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
      <div className="lg:col-span-2">
        <PageHeader title="Analyse" question="Où part mon argent ?" className="pb-0" />
      </div>

      <div className="lg:col-span-2">
        <SpendingBreakdown data={s.month.byCategory} currency={cur} total={s.month.expenses} title={`Où va ton argent ? · ${s.month.label}`} />
      </div>

      <section className="card p-5">
        <CardTitle
          action={
            <Link href="/recurrents" className="inline-flex items-center text-xs font-semibold text-fg-muted hover:text-fg">
              Gérer <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          Tes charges fixes
        </CardTitle>
        {s.recurring.activeCount === 0 ? (
          <p className="text-sm text-fg-muted">
            Aucune charge récurrente.{" "}
            <Link href="/recurrents" className="font-semibold text-fg underline underline-offset-4">
              Ajouter loyer, internet, abonnements…
            </Link>
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <Stat label="Par mois" value={formatMoney(s.recurring.monthlyTotal, cur)} sub={`${s.recurring.activeCount} charge${s.recurring.activeCount > 1 ? "s" : ""} active${s.recurring.activeCount > 1 ? "s" : ""}`} />
              <Stat
                label="Part du salaire"
                value={s.recurring.shareOfSalary === null ? "—" : formatPercent(s.recurring.shareOfSalary)}
                tone={s.recurring.shareOfSalary === null ? undefined : s.recurring.shareOfSalary >= 50 ? "negative" : s.recurring.shareOfSalary >= 30 ? "warning" : "positive"}
                sub={s.recurring.shareOfSalary === null ? "configure ton salaire" : "chaque mois"}
              />
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {s.recurring.items.slice(0, 5).map((r) => {
                const brand = brandFor(r.name);
                return (
                <li key={r.id} className="flex items-center gap-3 text-sm">
                  <span className="w-7 flex items-center justify-center text-lg" aria-hidden>
                    {brand?.domain ? (
                      <BrandLogo domain={brand.domain} fallback={r.icon} className="h-6 w-6 rounded-md" />
                    ) : brand?.icon ? (
                      <brand.icon className="h-5 w-5" strokeWidth={2.25} style={{ color: brand.color }} />
                    ) : (
                      r.icon
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{r.name}</span>
                    <span className="block text-xs text-fg-subtle">
                      prochain prélèvement le {formatDate(r.nextDate, r.nextDate.slice(0, 4) === s.today.slice(0, 4) ? "d MMM" : "d MMM yyyy")}
                    </span>
                  </span>
                  <span className="tabular font-bold">{formatMoney(r.monthly, cur)}<span className="text-xs font-normal text-fg-subtle">/mois</span></span>
                </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-fg-subtle mt-3">Une charge apparaît dans « Où va ton argent » le jour où elle est prélevée.</p>
          </>
        )}
      </section>

      {s.month.byCategory.length > 0 && incomeRef > 0 ? (
        <section className="card p-5">
          <CardTitle>Part de ton salaire</CardTitle>
          <ul className="flex flex-col gap-2">
            {s.month.byCategory.slice(0, 6).map((c) => {
              const share = (c.amount / incomeRef) * 100;
              return (
                <li key={c.categoryId ?? "none"} className="flex items-center gap-3 text-sm">
                  <span className="w-7 text-center text-lg" aria-hidden>{c.icon}</span>
                  <span className="flex-1 font-semibold truncate">{c.name}</span>
                  <span className={cn("tabular font-bold", share >= 30 ? "text-negative" : share >= 20 ? "text-warning" : "text-fg-muted")}>{formatPercent(share)}</span>
                  <span className="text-xs text-fg-subtle w-24 text-right">de tes revenus</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="card p-5">
        <CardTitle>Ton rythme de consommation</CardTitle>
        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="Par jour" value={formatMoney(s.avgDailySpend, cur)} sub="moyenne réelle" />
          <Stat label="Budget/jour" value={formatMoney(s.initialDailyAllowance, cur)} sub="au début du cycle" />
          <Stat
            label="Rythme"
            value={pace === null ? "—" : `${Math.round(pace * 100)} %`}
            tone={paceTone === "neutral" ? undefined : paceTone}
            sub={pace === null ? "" : pace >= 1.25 ? "trop rapide" : pace >= 1 ? "limite" : "sous contrôle"}
          />
        </div>
        {s.month.dailySpend.length > 1 ? (
          <div className="mt-4">
            <div className="text-[12px] font-semibold text-fg-muted px-1 mb-1">Dépenses quotidiennes · {s.month.label}</div>
            <DailyBars data={s.month.dailySpend} currency={cur} allowance={s.initialDailyAllowance || undefined} />
            <p className="text-[11px] text-fg-subtle px-1 mt-1">En rouge : les jours au-dessus de ton budget quotidien.</p>
          </div>
        ) : null}
      </section>

      <DailyAllowanceCard s={s} expanded />

      <InsightsList insights={s.insights} />

      <section className="card p-5">
        <CardTitle>6 derniers mois</CardTitle>
        <TrendBars data={s.monthlyTrend} currency={cur} />
        <div className="flex gap-4 justify-center mt-2 text-[11px] font-semibold text-fg-muted">
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-positive" /> Revenus</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-negative" /> Dépenses</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-accent" /> Épargne</span>
        </div>
      </section>

      {snapshot.transactions.length === 0 ? (
        <p className="text-center text-sm text-fg-muted lg:col-span-2">Ajoute des dépenses pour voir apparaître ton analyse.</p>
      ) : null}
    </div>
  );
}
