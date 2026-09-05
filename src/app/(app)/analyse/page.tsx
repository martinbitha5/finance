import { getFinanceData } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { SpendingBreakdown } from "@/components/dashboard/spending-breakdown";
import { InsightsList } from "@/components/dashboard/insights-list";
import { DailyAllowanceCard } from "@/components/dashboard/daily-allowance-card";
import { DailyBars, TrendBars } from "@/components/charts/trend-bars";
import { CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/primitives";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analyse" };

export default async function AnalysePage() {
  const { summary: s, snapshot } = (await getFinanceData())!;
  const cur = s.currency;
  const pace = s.paceRatio;
  const paceTone = pace === null ? "neutral" : pace >= 1.25 ? "negative" : pace >= 1 ? "warning" : "positive";
  const incomeRef = s.month.income || s.salary.amount;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Analyse" question="Où part mon argent ?" />

      <SpendingBreakdown data={s.month.byCategory} currency={cur} total={s.month.expenses} title={`Où va ton argent ? · ${s.month.label}`} />

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
        <p className="text-center text-sm text-fg-muted">Ajoute des dépenses pour voir apparaître ton analyse.</p>
      ) : null}
    </div>
  );
}
