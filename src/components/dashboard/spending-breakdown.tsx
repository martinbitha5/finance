import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CategorySpend } from "@/lib/finance/types";
import type { Currency } from "@/lib/constants";
import { formatMoney, formatPercent } from "@/lib/format";
import { Donut } from "@/components/charts/donut";
import { Progress, IconBubble } from "@/components/ui/primitives";
import { CardTitle } from "@/components/ui/card";

export function SpendingBreakdown({
  data,
  currency,
  total,
  limit,
  title = "Où va ton argent ?",
  linkTo,
  showDonut = true,
}: {
  data: CategorySpend[];
  currency: Currency;
  total: number;
  limit?: number;
  title?: string;
  linkTo?: string;
  showDonut?: boolean;
}) {
  const rows = limit ? data.slice(0, limit) : data;
  if (data.length === 0) {
    return (
      <section className="card p-5">
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-fg-muted">Aucune dépense enregistrée pour l&apos;instant.</p>
      </section>
    );
  }
  return (
    <section className="card p-5 animate-fade-up" style={{ animationDelay: "180ms" }}>
      <CardTitle
        action={
          linkTo ? (
            <Link href={linkTo} className="inline-flex items-center text-xs font-semibold text-fg-muted hover:text-fg">
              Tout voir <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : null
        }
      >
        {title}
      </CardTitle>
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {showDonut ? (
          <Donut
            data={data}
            size={168}
            center={
              <>
                <span className="text-[11px] font-semibold text-fg-muted">Total</span>
                <span className="text-lg font-extrabold tabular tracking-tight">{formatMoney(total, currency, { compact: true })}</span>
              </>
            }
          />
        ) : null}
        <ul className="flex-1 flex flex-col gap-3 min-w-0">
          {rows.map((c) => (
            <li key={c.categoryId ?? "none"} className="flex items-center gap-3">
              <IconBubble icon={c.icon} color={c.color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-semibold truncate">{c.name}</span>
                  <span className="tabular font-bold whitespace-nowrap">{formatMoney(c.amount, currency)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={c.percent} color={c.color} size="sm" className="flex-1" />
                  <span className="text-[11px] font-semibold text-fg-muted tabular w-9 text-right">{formatPercent(c.percent)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
