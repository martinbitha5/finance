"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Category, RecurringExpense } from "@/lib/finance/types";
import { CURRENCIES, FREQUENCIES, PAYMENT_METHODS, type Currency, type Frequency, type PaymentMethod } from "@/lib/constants";
import { formatMoney, formatDate } from "@/lib/format";
import { convert } from "@/lib/finance/currency";
import { monthlyEquivalent, describeWeekdays, WEEKDAYS } from "@/lib/finance/cycles";
import { brandFor } from "@/lib/finance/brands";
import { createRecurring, deleteRecurring, toggleRecurring, updateRecurring } from "@/actions/recurring";
import { useAction } from "@/hooks/use-action";
import { Sheet, ConfirmSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState, IconBubble, Toggle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function RecurringScreen({ items, categories, currency, rates, today }: { items: RecurringExpense[]; categories: Category[]; currency: Currency; rates: Record<Currency, number>; today: string }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [toDelete, setToDelete] = useState<RecurringExpense | null>(null);
  const del = useAction(deleteRecurring, { success: "Charge supprimée", onSuccess: () => setToDelete(null) });
  const toggle = useAction(({ id, v }: { id: string; v: boolean }) => toggleRecurring(id, v), {});
  const catById = new Map(categories.map((c) => [c.id, c]));

  const monthly = (r: RecurringExpense) => monthlyEquivalent(convert(r.amount, r.currency, currency, rates), r.frequency, r.weekdays);
  const totalMonthly = items.filter((r) => r.is_active).reduce((a, r) => a + monthly(r), 0);

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 ? (
        <section className="card p-5 flex items-center justify-between">
          <div>
            <div className="text-[12px] font-semibold text-fg-muted">Charges fixes par mois</div>
            <div className="text-2xl font-extrabold tabular tracking-tight">{formatMoney(totalMonthly, currency)}</div>
          </div>
          <div className="text-right text-xs text-fg-muted">
            {items.filter((r) => r.is_active).length} active{items.filter((r) => r.is_active).length > 1 ? "s" : ""}
          </div>
        </section>
      ) : null}

      {items.length === 0 ? (
        <EmptyState icon="🔁" title="Aucune charge récurrente" description="Loyer, internet, abonnements… Elles sont déduites automatiquement de ce que tu peux dépenser." action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Ajouter une charge</Button>} />
      ) : (
        <ul className="card p-0 overflow-hidden divide-y divide-border">
          {items.map((r) => {
            const cat = r.category_id ? catById.get(r.category_id) : undefined;
            const brand = brandFor(r.name);
            return (
              <li key={r.id} className={cn("flex items-center gap-3 px-4 py-3", !r.is_active && "opacity-60")}>
                <IconBubble icon={cat?.icon ?? "🔁"} color={brand?.color ?? cat?.color} logo={brand?.domain} />
                <button type="button" className="flex-1 min-w-0 text-left" onClick={() => setEditing(r)}>
                  <div className="font-semibold truncate">{r.name}</div>
                  <div className="text-xs text-fg-muted">
                    {formatMoney(r.amount, r.currency)}
                    {r.frequency === "weekly" && r.weekdays?.length ? ` × ${describeWeekdays(r.weekdays)}` : ` / ${FREQUENCIES.find((f) => f.value === r.frequency)?.short}`}
                    {r.frequency !== "monthly" ? ` · ≈ ${formatMoney(monthly(r), currency)}/mois` : ""}
                    {r.is_active ? ` · prochain le ${formatDate(r.next_date, "EEE d MMM")}` : " · en pause"}
                  </div>
                </button>
                <Toggle checked={r.is_active} onChange={(v) => toggle.execute({ id: r.id, v })} label={`Activer ${r.name}`} />
                <button type="button" onClick={() => setToDelete(r)} aria-label="Supprimer" className="text-fg-subtle hover:text-negative p-1"><Trash2 className="h-4 w-4" /></button>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 ? <Button variant="outline" full onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Ajouter une charge</Button> : null}

      <Sheet open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Modifier la charge" : "Nouvelle charge récurrente"}>
        <RecurringForm key={editing?.id ?? "new"} categories={categories} currency={currency} today={today} initial={editing} onDone={() => { setCreating(false); setEditing(null); }} />
      </Sheet>
      <ConfirmSheet open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => toDelete && del.execute(toDelete.id)} loading={del.pending} title="Supprimer cette charge ?" description="Les paiements déjà enregistrés restent dans tes transactions." />
    </div>
  );
}

function RecurringForm({ categories, currency, today, initial, onDone }: { categories: Category[]; currency: Currency; today: string; initial: RecurringExpense | null; onDone: () => void }) {
  const expenseCats = categories.filter((c) => c.kind === "expense");
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [cur, setCur] = useState<Currency>(initial?.currency ?? currency);
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? expenseCats.find((c) => c.slug === "subscriptions")?.id ?? expenseCats[0]?.id ?? "");
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? "monthly");
  const [nextDate, setNextDate] = useState(initial?.next_date ?? today);
  const [method, setMethod] = useState<PaymentMethod>(initial?.payment_method ?? "card");
  // Jours de la semaine pour une charge hebdomadaire (ex. transport du lundi au samedi).
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? [1, 2, 3, 4, 5, 6]);
  const toggleDay = (d: number) => setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  const amountNum = Number(amount) || 0;
  const weeklyMonthly = frequency === "weekly" ? monthlyEquivalent(amountNum, "weekly", weekdays.length ? weekdays : null) : 0;
  const create = useAction(createRecurring, { success: "Charge ajoutée", onSuccess: onDone });
  const update = useAction((input: unknown) => updateRecurring(initial!.id, input), { success: "Charge modifiée", onSuccess: onDone });
  const pending = create.pending || update.pending;
  const fields = initial ? update.fields : create.fields;
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = {
          name,
          amount,
          currency: cur,
          category_id: categoryId || null,
          frequency,
          next_date: nextDate,
          payment_method: method,
          is_active: initial?.is_active ?? true,
          weekdays: frequency === "weekly" && weekdays.length ? weekdays : null,
        };
        if (initial) update.execute(payload);
        else create.execute(payload);
      }}
    >
      <Field label="Nom" error={fields.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Netflix" autoFocus maxLength={60} />
      </Field>
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <Field label="Montant" error={fields.amount}>
          <Input inputMode="decimal" placeholder="10" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Devise">
          <Select value={cur} onChange={(e) => setCur(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Catégorie">
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fréquence">
          <Select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </Select>
        </Field>
        <Field label={frequency === "weekly" ? "À partir du" : "Prochain paiement"} error={fields.next_date}>
          <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
        </Field>
      </div>
      {frequency === "weekly" ? (
        <Field label="Jours concernés" error={fields.weekdays} hint={weekdays.length === 0 ? "Aucun jour : une fois par semaine, le jour de la date choisie." : undefined}>
          <div className="flex gap-1.5" role="group" aria-label="Jours de la semaine">
            {WEEKDAYS.map((d) => {
              const active = weekdays.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  aria-pressed={active}
                  aria-label={d.label}
                  title={d.label}
                  className={cn(
                    "h-10 flex-1 rounded-xl text-sm font-bold press transition-colors border",
                    active ? "bg-ink text-ink-fg border-ink dark:bg-fg dark:text-bg dark:border-fg" : "bg-surface-2 border-transparent text-fg-muted hover:text-fg",
                  )}
                >
                  {d.short}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              { label: "Lun. → Ven.", days: [1, 2, 3, 4, 5] },
              { label: "Lun. → Sam.", days: [1, 2, 3, 4, 5, 6] },
              { label: "Tous les jours", days: [1, 2, 3, 4, 5, 6, 7] },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setWeekdays(p.days)}
                className={cn(
                  "h-7 px-2.5 rounded-full text-[11px] font-semibold press border",
                  JSON.stringify(weekdays) === JSON.stringify(p.days) ? "bg-accent/20 border-accent text-fg" : "bg-surface border-border text-fg-muted hover:text-fg",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {weekdays.length > 0 && amountNum > 0 ? (
            <p className="mt-2 text-xs text-fg-muted">
              {formatMoney(amountNum, cur)} × {weekdays.length} jour{weekdays.length > 1 ? "s" : ""} par semaine ({describeWeekdays(weekdays)}) ≈ <b className="text-fg tabular">{formatMoney(weeklyMonthly, cur)}</b> par mois.
            </p>
          ) : null}
        </Field>
      ) : null}
      <Field label="Moyen de paiement">
        <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
        </Select>
      </Field>
      <p className="text-xs text-fg-subtle">À chaque échéance, MONY crée automatiquement la dépense correspondante.</p>
      <Button type="submit" size="lg" full loading={pending}>{initial ? "Enregistrer" : "Ajouter la charge"}</Button>
    </form>
  );
}
