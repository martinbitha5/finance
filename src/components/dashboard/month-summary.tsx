import type { FinanceSummary } from "@/lib/finance/types";
import { formatMoney, formatDate } from "@/lib/format";
import { Stat } from "@/components/ui/primitives";
import { BalanceArea } from "@/components/charts/balance-area";
import { CardTitle } from "@/components/ui/card";
import { round2 } from "@/lib/utils";

/**
 * "Ce mois-ci" follows the pay cycle when a salary is configured (what matters until the next payday),
 * and the calendar month otherwise.
 */
export function MonthSummary({ s }: { s: FinanceSummary }) {
  const cur = s.currency;
  const useCycle = s.salary.configured && !s.cycle.isCalendarMonth;
  const period = useCycle
    ? { income: s.cycle.income, expenses: s.cycle.expenses, savings: s.cycle.savings, available: round2(s.cycle.income - s.cycle.expenses - s.cycle.savings) }
    : { income: s.month.income, expenses: s.month.expenses, savings: s.month.savings, available: s.month.available };
  const title = useCycle ? "Depuis ta paie" : "Ce mois-ci";
  const hint = useCycle ? `${formatDate(s.cycle.start, "d MMM")} → ${formatDate(s.cycle.nextPayday, "d MMM")}` : s.month.label;

  return (
    <section className="card p-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
      <CardTitle action={<span className="text-xs font-semibold text-fg-subtle">{hint}</span>}>{title}</CardTitle>
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Revenus" value={formatMoney(period.income, cur)} tone="positive" />
        <Stat label="Dépenses" value={formatMoney(period.expenses, cur)} tone="negative" />
        <Stat label="Épargne" value={formatMoney(period.savings, cur)} />
        <Stat label="Disponible" value={formatMoney(period.available, cur)} tone={period.available < 0 ? "negative" : undefined} sub={useCycle ? "après épargne" : undefined} />
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[12px] font-semibold text-fg-muted">Évolution du solde</span>
          <span className="text-[11px] text-fg-subtle">— réel · - - projection</span>
        </div>
        <BalanceArea data={s.balanceHistory} currency={cur} />
      </div>
    </section>
  );
}
