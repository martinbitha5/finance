"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { Currency } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

export function TrendBars({
  data,
  currency,
  height = 160,
}: {
  data: { label: string; income: number; expenses: number; savings: number }[];
  currency: Currency;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barGap={3}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof data)[number];
              return (
                <div className="rounded-xl bg-ink text-ink-fg px-3 py-2 text-xs shadow-float tabular">
                  <div className="text-ink-muted mb-1 capitalize">{label}</div>
                  <div>Revenus <b>{formatMoney(p.income, currency)}</b></div>
                  <div>Dépenses <b>{formatMoney(p.expenses, currency)}</b></div>
                  <div>Épargne <b>{formatMoney(p.savings, currency)}</b></div>
                </div>
              );
            }}
          />
          <Bar dataKey="income" fill="var(--positive)" radius={[6, 6, 6, 6]} maxBarSize={14} />
          <Bar dataKey="expenses" fill="var(--negative)" radius={[6, 6, 6, 6]} maxBarSize={14} />
          <Bar dataKey="savings" fill="var(--accent)" radius={[6, 6, 6, 6]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyBars({ data, currency, allowance, height = 120 }: { data: { date: string; amount: number }[]; currency: Currency; allowance?: number; height?: number }) {
  const rows = data.map((d) => ({ ...d, day: d.date.slice(8) }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(rows.length / 8) - 1)} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof rows)[number];
              return (
                <div className="rounded-xl bg-ink text-ink-fg px-3 py-2 text-xs shadow-float tabular">
                  Le {p.day} · <b>{formatMoney(p.amount, currency)}</b>
                </div>
              );
            }}
          />
          <Bar dataKey="amount" radius={[5, 5, 5, 5]} maxBarSize={18} fill="var(--fg)" shape={(props: unknown) => {
            const { x, y, width, height: h, payload } = props as { x: number; y: number; width: number; height: number; payload: { amount: number } };
            const over = allowance !== undefined && payload.amount > allowance;
            return <rect x={x} y={y} width={width} height={h} rx={5} fill={over ? "var(--negative)" : "var(--fg)"} opacity={over ? 1 : 0.75} />;
          }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
