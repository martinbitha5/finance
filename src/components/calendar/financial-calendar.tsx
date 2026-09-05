"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import type { Category, Debt, IncomeSource, RecurringExpense, SavingsGoal, Transaction } from "@/lib/finance/types";
import type { Currency } from "@/lib/constants";
import { formatMoney, formatMonth, toISODate, formatDayLabel } from "@/lib/format";
import { occurrencesInRange, paydayInMonth } from "@/lib/finance/cycles";
import { convert } from "@/lib/finance/currency";
import { brandFor } from "@/lib/finance/brands";
import { IconBubble } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  date: string;
  icon: string;
  logo?: string;
  color: string;
  label: string;
  amount: number | null;
  kind: "salary" | "expense" | "income" | "saving" | "recurring" | "goal" | "debt";
  planned: boolean;
}

export function FinancialCalendar({
  transactions,
  recurring,
  incomeSources,
  goals,
  debts = [],
  categories,
  currency,
  rates,
  today,
}: {
  transactions: Transaction[];
  recurring: RecurringExpense[];
  incomeSources: IncomeSource[];
  goals: SavingsGoal[];
  debts?: Debt[];
  categories: Category[];
  currency: Currency;
  rates: Record<Currency, number>;
  today: string;
}) {
  const [month, setMonth] = useState(() => startOfMonth(parseISO(today)));
  const [selected, setSelected] = useState(today);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const events = useMemo<Event[]>(() => {
    const start = toISODate(startOfMonth(month));
    const end = toISODate(addMonths(startOfMonth(month), 1));
    const out: Event[] = [];
    for (const t of transactions) {
      if (t.date < start || t.date >= end) continue;
      const cat = t.category_id ? catById.get(t.category_id) : undefined;
      const brand = t.type === "expense" ? brandFor(t.description) : null;
      out.push({
        id: t.id,
        date: t.date,
        icon: t.type === "saving" ? "🎯" : cat?.icon ?? (t.type === "income" ? "💰" : "💳"),
        logo: brand?.domain,
        color: t.type === "saving" ? "#EAB308" : brand?.color ?? cat?.color ?? (t.type === "income" ? "#22C55E" : "#94A3B8"),
        label: t.description || cat?.name || "",
        amount: (t.type === "income" ? 1 : -1) * convert(t.amount, t.currency, currency, rates),
        kind: t.type === "income" ? (cat?.slug === "salary" ? "salary" : "income") : t.type,
        planned: false,
      });
    }
    const postedRecurring = new Set(transactions.filter((t) => t.recurring_expense_id).map((t) => `${t.recurring_expense_id}:${t.date}`));
    for (const r of recurring) {
      if (!r.is_active) continue;
      const cat = r.category_id ? catById.get(r.category_id) : undefined;
      const brand = brandFor(r.name);
      for (const d of occurrencesInRange(r.next_date, r.frequency, r.day_of_month, { start: r.next_date > start ? r.next_date : start, end }, r.weekdays)) {
        if (d < today || postedRecurring.has(`${r.id}:${d}`)) continue;
        out.push({ id: `${r.id}:${d}`, date: d, icon: cat?.icon ?? "🔁", logo: brand?.domain, color: brand?.color ?? cat?.color ?? "#94A3B8", label: r.name, amount: -convert(r.amount, r.currency, currency, rates), kind: "recurring", planned: true });
      }
    }
    for (const s of incomeSources) {
      if (!s.is_active || !s.is_recurring || !s.pay_day) continue;
      const d = toISODate(paydayInMonth(month, s.pay_day));
      const alreadyPosted = out.some((e) => e.kind === "salary" && e.date.slice(0, 7) === d.slice(0, 7));
      if (d >= today && !alreadyPosted) out.push({ id: `salary:${d}`, date: d, icon: "💰", color: "#22C55E", label: s.label, amount: convert(s.amount, s.currency, currency, rates), kind: "salary", planned: true });
    }
    for (const g of goals) {
      if (g.target_date && g.target_date >= start && g.target_date < end && !g.is_archived) {
        out.push({ id: `goal:${g.id}`, date: g.target_date, icon: g.icon, color: "#EAB308", label: `Objectif ${g.name}`, amount: null, kind: "goal", planned: true });
      }
    }
    for (const d of debts) {
      if (d.due_date && d.due_date >= start && d.due_date < end && !d.is_settled) {
        const owed = d.direction === "owed";
        out.push({ id: `debt:${d.id}`, date: d.due_date, icon: owed ? "🧾" : "🤝", color: owed ? "#DC2626" : "#0D9488", label: owed ? `Échéance dette · ${d.name}` : `${d.counterparty ?? d.name} doit rembourser`, amount: null, kind: "debt", planned: true });
      }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [month, transactions, recurring, incomeSources, goals, debts, catById, currency, rates, today]);

  const byDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [events]);

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  const dayEvents = byDay.get(selected) ?? [];
  const upcoming = events.filter((e) => e.date >= today && e.date !== selected).slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => setMonth(subMonths(month, 1))} aria-label="Mois précédent" className="h-9 w-9 rounded-full bg-surface-2 inline-flex items-center justify-center press"><ChevronLeft className="h-4 w-4" /></button>
          <h2 className="font-bold">{formatMonth(month)}</h2>
          <button type="button" onClick={() => setMonth(addMonths(month, 1))} aria-label="Mois suivant" className="h-9 w-9 rounded-full bg-surface-2 inline-flex items-center justify-center press"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-fg-subtle mb-1">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const iso = toISODate(d);
            const evs = byDay.get(iso) ?? [];
            const inMonth = isSameMonth(d, month);
            const net = evs.reduce((a, e) => a + (e.amount ?? 0), 0);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className={cn(
                  "relative aspect-square sm:aspect-[5/4] rounded-xl flex flex-col items-center justify-center text-sm font-semibold press transition-colors",
                  !inMonth && "opacity-30",
                  selected === iso ? "bg-ink text-ink-fg dark:bg-fg dark:text-bg" : iso === today ? "bg-accent/20" : "hover:bg-surface-2",
                )}
              >
                {format(d, "d")}
                {evs.length > 0 ? (
                  <span className="flex gap-0.5 mt-0.5">
                    {evs.slice(0, 3).map((e) => (
                      <i key={e.id} className={cn("h-1.5 w-1.5 rounded-full", e.planned && "ring-1 ring-inset ring-current opacity-70")} style={{ background: e.kind === "salary" ? "#22C55E" : e.kind === "goal" ? "#EAB308" : e.kind === "debt" ? "#DC2626" : e.color }} />
                    ))}
                  </span>
                ) : (
                  <span className="h-1.5 mt-0.5" />
                )}
                {net !== 0 && inMonth ? <span className={cn("hidden sm:block absolute bottom-0.5 text-[9px] tabular leading-none", net > 0 ? "text-positive" : "opacity-60")}>{net > 0 ? "+" : ""}{Math.round(net)}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="px-1 mb-1.5 text-[12px] font-bold uppercase tracking-wider text-fg-subtle capitalize">{formatDayLabel(selected)}</h3>
        {dayEvents.length === 0 ? (
          <p className="card px-4 py-5 text-sm text-fg-muted text-center">Rien ce jour-là.</p>
        ) : (
          <EventList events={dayEvents} currency={currency} />
        )}
      </section>

      {upcoming.length > 0 ? (
        <section>
          <h3 className="px-1 mb-1.5 text-[12px] font-bold uppercase tracking-wider text-fg-subtle">Timeline à venir</h3>
          <EventList events={upcoming} currency={currency} showDate />
        </section>
      ) : null}
    </div>
  );
}

function EventList({ events, currency, showDate }: { events: Event[]; currency: Currency; showDate?: boolean }) {
  return (
    <ul className="card p-0 overflow-hidden divide-y divide-border">
      {events.map((e) => (
        <li key={e.id} className="flex items-center gap-3 px-4 py-3">
          <IconBubble icon={e.icon} color={e.color} size="sm" logo={e.logo} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{e.label}</div>
            <div className="text-xs text-fg-muted">
              {showDate ? <span className="capitalize">{format(parseISO(e.date), "EEE d MMM", { locale: fr })} · </span> : null}
              {e.planned ? (e.kind === "goal" ? "date cible" : e.kind === "debt" ? "échéance" : "prévu") : "enregistré"}
            </div>
          </div>
          {e.amount !== null ? (
            <span className={cn("tabular font-bold", e.amount > 0 ? "text-positive" : "", e.planned && "opacity-70")}>
              {e.amount > 0 ? "+" : "-"}{formatMoney(Math.abs(e.amount), currency)}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
