import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { DebtStatus } from "@/lib/finance/types";
import type { Currency } from "@/lib/constants";
import { formatMoney, formatDate } from "@/lib/format";
import { CardTitle } from "@/components/ui/card";
import { IconBubble, Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function DebtsCard({ debts, currency, totalOwed, totalLent }: { debts: DebtStatus[]; currency: Currency; totalOwed: number; totalLent: number }) {
  const active = debts.filter((d) => d.state !== "settled").slice(0, 3);
  if (active.length === 0) return null;
  return (
    <section className="card p-5 animate-fade-up" style={{ animationDelay: "330ms" }}>
      <CardTitle
        action={
          <Link href="/dettes" className="inline-flex items-center text-xs font-semibold text-fg-muted hover:text-fg">
            Tout voir <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        Dettes
      </CardTitle>
      <div className="flex gap-4 text-sm mb-3">
        {totalOwed > 0 ? (
          <span className="text-fg-muted">Je dois <b className="text-negative tabular">{formatMoney(totalOwed, currency)}</b></span>
        ) : null}
        {totalLent > 0 ? (
          <span className="text-fg-muted">On me doit <b className="text-positive tabular">{formatMoney(totalLent, currency)}</b></span>
        ) : null}
      </div>
      <ul className="flex flex-col gap-3">
        {active.map((d) => {
          const owed = d.debt.direction === "owed";
          return (
            <li key={d.debt.id}>
              <Link href="/dettes" className="flex items-center gap-3">
                <IconBubble icon={owed ? "🧾" : "🤝"} color={owed ? "#DC2626" : "#0D9488"} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-semibold truncate">{d.debt.name}</span>
                    <span className="tabular font-bold whitespace-nowrap">{formatMoney(d.remaining, currency)}</span>
                  </div>
                  <Progress value={d.percent} color={d.state === "overdue" ? "var(--negative)" : owed ? "var(--fg)" : "var(--accent)"} size="sm" className="mt-1" />
                  <div className={cn("text-[11px] mt-1", d.state === "overdue" ? "text-negative font-semibold" : "text-fg-subtle")}>
                    {d.state === "overdue"
                      ? `En retard depuis ${Math.abs(d.daysLeft ?? 0)} j`
                      : d.debt.due_date
                        ? `Échéance ${formatDate(d.debt.due_date, "d MMM")} · ${d.daysLeft} j`
                        : d.projectedSettleDate
                          ? `Liquidée vers ${formatDate(d.projectedSettleDate, "MMM yyyy")}`
                          : "Sans échéance"}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
