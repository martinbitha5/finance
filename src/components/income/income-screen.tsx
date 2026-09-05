"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, CalendarClock } from "lucide-react";
import type { FinanceSummary, IncomeSource } from "@/lib/finance/types";
import { CURRENCIES, FREQUENCIES, INCOME_TYPES, type Currency, type Frequency, type IncomeType } from "@/lib/constants";
import { formatMoney, formatDate } from "@/lib/format";
import { createIncomeSource, deleteIncomeSource, saveSalary, updateIncomeSource } from "@/actions/income";
import { useAction } from "@/hooks/use-action";
import { Sheet, ConfirmSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Chip } from "@/components/ui/segmented";
import { Badge, IconBubble, Toggle, Stat } from "@/components/ui/primitives";
import { CardTitle } from "@/components/ui/card";

export function IncomeScreen({ s, sources }: { s: FinanceSummary; sources: IncomeSource[] }) {
  const [editSalary, setEditSalary] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<IncomeSource | null>(null);
  const [toDelete, setToDelete] = useState<IncomeSource | null>(null);
  const del = useAction(deleteIncomeSource, { success: "Source supprimée", onSuccess: () => setToDelete(null) });
  const others = sources.filter((x) => x.id !== s.salary.source?.id && !(x.type === "salary" && !x.is_active));

  return (
    <div className="flex flex-col gap-4">
      <section className="aurora rounded-4xl p-5 text-ink-fg shadow-float">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted">Mon salaire</div>
            {s.salary.configured ? (
              <>
                <div className="text-3xl font-extrabold tabular tracking-tight mt-1">
                  {formatMoney(s.salary.amount, s.currency)} <span className="text-base font-semibold text-ink-muted">/ mois</span>
                </div>
                <div className="text-sm text-ink-muted mt-1">
                  Reçu le <b className="text-ink-fg">{s.salary.payDay}</b> du mois {s.salary.isVariable ? <Badge tone="accent" className="ml-1">variable</Badge> : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-muted mt-2 max-w-xs">Définis ton salaire et ta date de paie : MONY calculera ce que tu peux dépenser chaque jour.</p>
            )}
          </div>
          <Button variant="secondary" size="sm" className="!bg-white/10 !text-ink-fg hover:!bg-white/20" onClick={() => setEditSalary(true)}>
            <Pencil className="h-3.5 w-3.5" /> {s.salary.configured ? "Modifier" : "Configurer"}
          </Button>
        </div>
        {s.salary.configured ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-[11px] text-ink-muted">Prochaine paie</div>
              <div className="font-bold text-sm mt-0.5 inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {formatDate(s.cycle.nextPayday, "d MMM")}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-[11px] text-ink-muted">Jours restants</div>
              <div className="font-bold text-sm mt-0.5 tabular">{s.cycle.daysRemaining}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-[11px] text-ink-muted">À conserver</div>
              <div className="font-bold text-sm mt-0.5 tabular">{formatMoney(s.remainingCharges + s.remainingSavings, s.currency)}</div>
            </div>
          </div>
        ) : null}
      </section>

      {s.salary.configured ? (
        <section className="card p-5">
          <CardTitle>Ce cycle de paie</CardTitle>
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Revenus reçus" value={formatMoney(s.cycle.income, s.currency)} tone="positive" sub={`depuis le ${formatDate(s.cycle.start, "d MMM")}`} />
            <Stat label="Par jour" value={formatMoney(s.dailyAllowance, s.currency)} sub="dépense recommandée" />
          </div>
          {s.cycle.salaryReceived === 0 ? (
            <div className="mt-3 rounded-2xl bg-warning/10 border border-warning/30 px-4 py-3 text-sm">
              <b>Salaire non enregistré ce cycle.</b> Quand tu le reçois, ajoute-le comme revenu pour mettre à jour ton solde.
              <Button href="/ajouter?type=income" size="sm" variant="secondary" className="mt-2">Enregistrer mon salaire</Button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="card p-5">
        <CardTitle action={<Button size="sm" variant="secondary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Ajouter</Button>}>Autres revenus</CardTitle>
        {others.length === 0 ? (
          <p className="text-sm text-fg-muted">Bonus, freelance, business, cadeaux… Ajoute des sources pour les retrouver rapidement.</p>
        ) : (
          <ul className="divide-y divide-border -mx-5">
            {others.map((src) => {
              const t = INCOME_TYPES.find((x) => x.value === src.type);
              return (
                <li key={src.id} className="flex items-center gap-3 px-5 py-3">
                  <IconBubble icon={t?.icon ?? "💰"} color="#22C55E" size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{src.label}</div>
                    <div className="text-xs text-fg-muted">
                      {t?.label}
                      {src.is_recurring && src.frequency ? ` · ${FREQUENCIES.find((f) => f.value === src.frequency)?.label.toLowerCase()}` : " · ponctuel"}
                      {!src.is_active ? " · inactif" : ""}
                    </div>
                  </div>
                  <span className="tabular font-bold text-positive">+{formatMoney(src.amount, src.currency)}</span>
                  <button type="button" onClick={() => setEditing(src)} aria-label="Modifier" className="text-fg-subtle hover:text-fg p-1"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setToDelete(src)} aria-label="Supprimer" className="text-fg-subtle hover:text-negative p-1"><Trash2 className="h-4 w-4" /></button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Sheet open={editSalary} onClose={() => setEditSalary(false)} title="Mon salaire">
        <SalaryForm s={s} onDone={() => setEditSalary(false)} />
      </Sheet>
      <Sheet open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Modifier la source" : "Nouvelle source de revenu"}>
        <IncomeSourceForm key={editing?.id ?? "new"} currency={s.currency} initial={editing} onDone={() => { setCreating(false); setEditing(null); }} />
      </Sheet>
      <ConfirmSheet open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => toDelete && del.execute(toDelete.id)} loading={del.pending} title="Supprimer cette source ?" />
    </div>
  );
}

export function SalaryForm({ s, onDone, submitLabel }: { s: FinanceSummary; onDone: () => void; submitLabel?: string }) {
  const src = s.salary.source;
  const [amount, setAmount] = useState(src ? String(src.amount) : "");
  const [cur, setCur] = useState<Currency>(src?.currency ?? s.currency);
  const [payDay, setPayDay] = useState(String(src?.pay_day ?? 5));
  const [variable, setVariable] = useState(src?.is_variable ?? false);
  const save = useAction(saveSalary, { success: "Salaire enregistré", onSuccess: onDone });
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.execute({ amount, currency: cur, pay_day: payDay, is_variable: variable });
      }}
    >
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <Field label="Salaire mensuel" error={save.fields.amount} hint={variable ? "Indique une estimation prudente." : undefined}>
          <Input inputMode="decimal" placeholder="650" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </Field>
        <Field label="Devise">
          <Select value={cur} onChange={(e) => setCur(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Date de réception" error={save.fields.pay_day} hint="Jour du mois où ton salaire arrive.">
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <button key={d} type="button" onClick={() => setPayDay(String(d))} className={`h-9 rounded-xl text-sm font-semibold press ${payDay === String(d) ? "bg-ink text-ink-fg dark:bg-fg dark:text-bg" : "bg-surface-2 text-fg-muted"}`}>
              {d}
            </button>
          ))}
        </div>
      </Field>
      <div className="flex items-center justify-between rounded-2xl bg-surface-2/70 px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Salaire variable</div>
          <div className="text-xs text-fg-muted">Le montant change d&apos;un mois à l&apos;autre.</div>
        </div>
        <Toggle checked={variable} onChange={setVariable} label="Salaire variable" />
      </div>
      <Button type="submit" size="lg" full loading={save.pending}>{submitLabel ?? "Enregistrer"}</Button>
    </form>
  );
}

function IncomeSourceForm({ currency, initial, onDone }: { currency: Currency; initial: IncomeSource | null; onDone: () => void }) {
  const [type, setType] = useState<IncomeType>(initial?.type ?? "freelance");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [cur, setCur] = useState<Currency>(initial?.currency ?? currency);
  const [recurring, setRecurring] = useState(initial?.is_recurring ?? false);
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? "monthly");
  const [active, setActive] = useState(initial?.is_active ?? true);
  const create = useAction(createIncomeSource, { success: "Source ajoutée", onSuccess: onDone });
  const update = useAction((input: unknown) => updateIncomeSource(initial!.id, input), { success: "Source modifiée", onSuccess: onDone });
  const pending = create.pending || update.pending;
  const fields = initial ? update.fields : create.fields;
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = { type, label, amount, currency: cur, is_recurring: recurring, frequency: recurring ? frequency : null, pay_day: null, is_variable: false, is_active: active };
        if (initial) update.execute(payload);
        else create.execute(payload);
      }}
    >
      <Field label="Type">
        <div className="flex flex-wrap gap-2">
          {INCOME_TYPES.filter((t) => t.value !== "salary").map((t) => (
            <Chip key={t.value} active={type === t.value} onClick={() => { setType(t.value); if (!label) setLabel(t.label); }}>
              <span>{t.icon}</span> {t.label}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Nom" error={fields.label}>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Mission freelance" maxLength={60} />
      </Field>
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <Field label="Montant" error={fields.amount}>
          <Input inputMode="decimal" placeholder="80" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Devise">
          <Select value={cur} onChange={(e) => setCur(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </Select>
        </Field>
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-surface-2/70 px-4 py-3">
        <div className="text-sm font-semibold">Revenu récurrent</div>
        <Toggle checked={recurring} onChange={setRecurring} label="Récurrent" />
      </div>
      {recurring ? (
        <Field label="Fréquence">
          <Select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </Select>
        </Field>
      ) : null}
      {initial ? (
        <div className="flex items-center justify-between rounded-2xl bg-surface-2/70 px-4 py-3">
          <div className="text-sm font-semibold">Actif</div>
          <Toggle checked={active} onChange={setActive} label="Actif" />
        </div>
      ) : null}
      <Button type="submit" size="lg" full loading={pending}>{initial ? "Enregistrer" : "Ajouter"}</Button>
    </form>
  );
}
