import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { UpcomingCharge } from "@/lib/finance/types";
import type { Currency } from "@/lib/constants";
import { formatMoney, formatDayLabel } from "@/lib/format";
import { IconBubble } from "@/components/ui/primitives";
import { CardTitle } from "@/components/ui/card";

export function UpcomingCharges({ charges, currency, total, salary }: { charges: UpcomingCharge[]; currency: Currency; total: number; salary?: { amount: number; date: string } | null }) {
  const rows = charges.slice(0, 4);
  return (
    <section className="card p-5 animate-fade-up" style={{ animationDelay: "300ms" }}>
      <CardTitle
        action={
          <Link href="/calendrier" className="inline-flex items-center text-xs font-semibold text-fg-muted hover:text-fg">
            Calendrier <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        À venir
      </CardTitle>
      {rows.length === 0 && !salary ? (
        <p className="text-sm text-fg-muted">
          Aucune charge prévue avant la prochaine paie.{" "}
          <Link href="/recurrents" className="font-semibold text-fg underline underline-offset-4">
            Ajouter une charge récurrente
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {rows.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5 first:pt-0">
              <IconBubble icon={c.icon} color={c.color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{c.name}</div>
                <div className="text-xs text-fg-muted capitalize">{formatDayLabel(c.date)}</div>
              </div>
              <span className="tabular font-bold text-sm">-{formatMoney(c.amount, currency)}</span>
            </li>
          ))}
          {salary ? (
            <li className="flex items-center gap-3 py-2.5 first:pt-0">
              <IconBubble icon="💰" color="#22C55E" size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">Salaire</div>
                <div className="text-xs text-fg-muted capitalize">{formatDayLabel(salary.date)}</div>
              </div>
              <span className="tabular font-bold text-sm text-positive">+{formatMoney(salary.amount, currency)}</span>
            </li>
          ) : null}
          {charges.length > 0 ? (
            <li className="flex justify-between pt-3 text-xs font-semibold text-fg-muted">
              <span>Charges restantes avant la paie</span>
              <span className="tabular text-fg">{formatMoney(total, currency)}</span>
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}
