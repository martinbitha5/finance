import { getFinanceData } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { SpendingBreakdown } from "@/components/dashboard/spending-breakdown";
import { TrendBars } from "@/components/charts/trend-bars";
import { CardTitle } from "@/components/ui/card";
import { Stat, IconBubble } from "@/components/ui/primitives";
import { formatMoney, formatPercent, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Rapport du mois" };

export default async function ReportPage() {
  const { summary: s, snapshot } = (await getFinanceData())!;
  const cur = s.currency;
  const m = s.month;
  const catById = new Map(snapshot.categories.map((c) => [c.id, c]));
  const savingsRate = m.income > 0 ? (m.savings / m.income) * 100 : 0;
  // The month is in progress: compare with the previous month cut at the same day, so the comparison is fair.
  const dayOfMonth = Number(s.today.slice(8, 10));
  const monthOver = m.range.end <= s.today;
  const prev = monthOver ? s.previousMonth : s.previousMonthToDate;
  const change = monthOver ? s.monthChange.expensesPct : s.monthToDateChange.expensesPct;
  const prevLabel = monthOver ? s.previousMonth.label : `${s.previousMonth.label} (au ${dayOfMonth})`;
  const incomeChange = monthOver ? s.monthChange.incomePct : s.previousMonthToDate.income > 0 ? Math.round(((m.income - s.previousMonthToDate.income) / s.previousMonthToDate.income) * 100) : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Rapport du mois" question={m.label} back="/plus" />

      <section className="card p-5">
        <div className="grid grid-cols-2 gap-2.5">
          <Stat label="Revenus" value={formatMoney(m.income, cur)} tone="positive" sub={pctSub(incomeChange, monthOver)} />
          <Stat label="Dépenses" value={formatMoney(m.expenses, cur)} tone="negative" sub={pctSub(change, monthOver)} />
          <Stat label="Épargne" value={formatMoney(m.savings, cur)} sub={m.income > 0 ? `${formatPercent(savingsRate)} des revenus` : undefined} />
          <Stat label="Reste" value={formatMoney(m.available, cur)} tone={m.available < 0 ? "negative" : undefined} />
        </div>
        {prev.expenses > 0 && change !== null ? (
          <p className={cn("mt-4 rounded-2xl px-4 py-3 text-sm font-semibold", change > 0 ? "bg-negative/8 text-negative" : "bg-positive/8 text-positive")}>
            {change > 0 ? `📈 Tu as dépensé ${formatPercent(Math.abs(change))} de plus ce mois-ci` : change < 0 ? `📉 Tu as dépensé ${formatPercent(Math.abs(change))} de moins ce mois-ci` : "➡️ Dépenses identiques au mois dernier"}
            {monthOver ? "." : " (à la même date)."}
            <span className="block text-xs font-normal opacity-80 mt-0.5">
              {prevLabel} : {formatMoney(prev.expenses, cur)} · {m.label} : {formatMoney(m.expenses, cur)}
            </span>
          </p>
        ) : null}
      </section>

      <section className="card p-5">
        <CardTitle>Tes 5 plus grosses dépenses</CardTitle>
        {m.topExpenses.length === 0 ? (
          <p className="text-sm text-fg-muted">Aucune dépense ce mois-ci.</p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {m.topExpenses.map((t, i) => {
              const cat = t.category_id ? catById.get(t.category_id) : undefined;
              return (
                <li key={t.id} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-fg-subtle tabular">{i + 1}.</span>
                  <IconBubble icon={cat?.icon ?? "💳"} color={cat?.color} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{t.description || cat?.name}</div>
                    <div className="text-xs text-fg-muted">{formatDate(t.date, "d MMM")}{cat ? ` · ${cat.name}` : ""}</div>
                  </div>
                  <span className="tabular font-bold">{formatMoney(t.amount, t.currency)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <SpendingBreakdown data={m.byCategory} currency={cur} total={m.expenses} title="Répartition par catégorie" />

      {prev.byCategory.length > 0 ? (
        <section className="card p-5">
          <CardTitle>Comparaison avec {prevLabel}</CardTitle>
          <ul className="flex flex-col gap-2.5">
            {m.byCategory.slice(0, 6).map((c) => {
              const p = prev.byCategory.find((x) => x.categoryId === c.categoryId);
              const diff = c.amount - (p?.amount ?? 0);
              return (
                <li key={c.categoryId ?? "none"} className="flex items-center gap-3 text-sm">
                  <span className="text-lg w-7 text-center" aria-hidden>{c.icon}</span>
                  <span className="flex-1 font-semibold truncate">{c.name}</span>
                  <span className="text-xs text-fg-subtle tabular w-16 text-right">{p ? formatMoney(p.amount, cur) : "—"}</span>
                  <span className="tabular font-bold w-16 text-right">{formatMoney(c.amount, cur)}</span>
                  <span className={cn("tabular text-xs font-bold w-16 text-right", diff > 0 ? "text-negative" : diff < 0 ? "text-positive" : "text-fg-subtle")}>
                    {diff > 0 ? "+" : ""}{formatMoney(diff, cur)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="card p-5">
        <CardTitle>Évolution mensuelle</CardTitle>
        <TrendBars data={s.monthlyTrend} currency={cur} />
      </section>
    </div>
  );
}

function pctSub(p: number | null, monthOver: boolean) {
  if (p === null) return "vs mois dernier : —";
  return `${p > 0 ? "+" : ""}${formatPercent(p)} vs mois dernier${monthOver ? "" : " à date"}`;
}
