import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Insight } from "@/lib/finance/types";
import { cn } from "@/lib/utils";
import { CardTitle } from "@/components/ui/card";

const toneClass: Record<Insight["severity"], string> = {
  danger: "border-negative/30 bg-negative/6",
  warning: "border-warning/30 bg-warning/8",
  success: "border-positive/30 bg-positive/6",
  info: "border-info/25 bg-info/6",
};

export function InsightsList({ insights, limit, title = "Analyse de tes finances", compact }: { insights: Insight[]; limit?: number; title?: string; compact?: boolean }) {
  const rows = limit ? insights.slice(0, limit) : insights;
  if (rows.length === 0) {
    return (
      <section className="card p-5">
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-fg-muted">Ajoute quelques dépenses et MONY analysera tes habitudes automatiquement.</p>
      </section>
    );
  }
  return (
    <section className={cn(!compact && "card p-5", "animate-fade-up")} style={{ animationDelay: "240ms" }}>
      {!compact ? (
        <CardTitle action={limit && insights.length > limit ? <Link href="/analyse" className="inline-flex items-center text-xs font-semibold text-fg-muted hover:text-fg">Tout voir <ChevronRight className="h-3.5 w-3.5" /></Link> : null}>
          {title}
        </CardTitle>
      ) : null}
      <ul className="flex flex-col gap-2.5">
        {rows.map((i) => {
          const inner = (
            <>
              <span className="text-xl leading-none mt-0.5" aria-hidden>
                {i.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-semibold leading-snug">{i.title}</span>
                {i.body ? <span className="block text-xs text-fg-muted mt-0.5">{i.body}</span> : null}
              </span>
              {i.href ? <ChevronRight className="h-4 w-4 text-fg-subtle shrink-0 mt-1" /> : null}
            </>
          );
          const cls = cn("flex items-start gap-3 rounded-2xl border px-4 py-3 transition-colors", toneClass[i.severity], i.href && "hover:brightness-[0.98] press");
          return (
            <li key={i.id}>
              {i.href ? (
                <Link href={i.href} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
