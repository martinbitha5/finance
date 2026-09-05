"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { CategorySpend } from "@/lib/finance/types";

export function Donut({ data, size = 180, center }: { data: CategorySpend[]; size?: number; center?: React.ReactNode }) {
  const rows = data.filter((d) => d.amount > 0);
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rows}
            dataKey="amount"
            nameKey="name"
            innerRadius="72%"
            outerRadius="100%"
            paddingAngle={rows.length > 1 ? 3 : 0}
            cornerRadius={6}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            isAnimationActive
          >
            {rows.map((d) => (
              <Cell key={d.categoryId ?? "none"} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {center ? <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">{center}</div> : null}
    </div>
  );
}
