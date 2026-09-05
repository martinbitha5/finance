"use client";

import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BalancePoint } from "@/lib/finance/types";
import type { Currency } from "@/lib/constants";
import { formatMoney, formatDate } from "@/lib/format";

export function BalanceArea({ data, currency, height = 160 }: { data: BalancePoint[]; currency: Currency; height?: number }) {
  if (data.length < 2) return null;
  const rows = data.map((p) => ({
    date: p.date,
    actual: p.projected ? null : p.balance,
    projected: p.projected ? p.balance : null,
    // join point so the dashed line starts where the solid one ends
    ...(p.projected ? {} : {}),
  }));
  const lastActualIdx = rows.findIndex((r) => r.projected !== null) - 1;
  if (lastActualIdx >= 0) rows[lastActualIdx].projected = rows[lastActualIdx].actual;

  const min = Math.min(...data.map((p) => p.balance), 0);
  const max = Math.max(...data.map((p) => p.balance), 1);
  const tickEvery = Math.max(1, Math.round(rows.length / 5));
  const actualCount = rows.filter((r) => r.actual !== null).length;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            interval={tickEvery - 1}
            tickFormatter={(v: string) => formatDate(v, "d MMM")}
            tick={{ fontSize: 11 }}
            padding={{ left: 18, right: 18 }}
            tickMargin={6}
          />
          <YAxis hide domain={[min < 0 ? min * 1.1 : 0, max * 1.1]} />
          {min < 0 ? <ReferenceLine y={0} stroke="var(--negative)" strokeDasharray="3 3" /> : null}
          <Tooltip
            cursor={{ stroke: "var(--border-strong)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof rows)[number];
              const v = p.actual ?? p.projected ?? 0;
              return (
                <div className="rounded-xl bg-ink text-ink-fg px-3 py-2 text-xs shadow-float">
                  <div className="text-ink-muted">{formatDate(p.date, "EEEE d MMM")}{p.actual === null ? " · projection" : ""}</div>
                  <div className="font-bold tabular text-sm">{formatMoney(v, currency)}</div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="var(--accent)"
            strokeWidth={2.5}
            fill="url(#balFill)"
            dot={actualCount < 2 ? { r: 4, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 } : false}
            activeDot={{ r: 4 }}
            connectNulls={false}
            isAnimationActive
          />
          <Area type="monotone" dataKey="projected" stroke="var(--fg-subtle)" strokeWidth={2} strokeDasharray="4 4" fill="transparent" dot={false} activeDot={{ r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
