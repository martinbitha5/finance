"use client";

import { useState } from "react";
import { Plus, PiggyBank, Pencil, Trash2, Archive } from "lucide-react";
import type { GoalStatus } from "@/lib/finance/types";
import { CURRENCIES, GOAL_KINDS, PAYMENT_METHODS, type Currency, type GoalKind, type PaymentMethod } from "@/lib/constants";
import { formatMoney, formatPercent, formatDate } from "@/lib/format";
import { archiveGoal, contributeToGoal, createGoal, deleteGoal, updateGoal } from "@/actions/goals";
import { useAction } from "@/hooks/use-action";
import { Sheet, ConfirmSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Chip } from "@/components/ui/segmented";
import { Badge, EmptyState, IconBubble, Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function GoalsScreen({ goals, currency, today, totalSaved, plannedMonthly, savedThisMonth }: { goals: GoalStatus[]; currency: Currency; today: string; totalSaved: number; plannedMonthly: number; savedThisMonth: number }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<GoalStatus | null>(null);
  const [contrib, setContrib] = useState<GoalStatus | null>(null);
  const [toDelete, setToDelete] = useState<GoalStatus | null>(null);
  const del = useAction(deleteGoal, { success: "Objectif supprimé", onSuccess: () => setToDelete(null) });
  const archive = useAction((id: string) => archiveGoal(id, true), { success: "Objectif archivé" });

  return (
    <div className="flex flex-col gap-4">
      {goals.length > 0 ? (
        <section className="aurora rounded-4xl p-5 text-ink-fg shadow-float">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted">Total épargné</div>
          <div className="text-3xl font-extrabold tabular tracking-tight mt-1">{formatMoney(totalSaved, currency)}</div>
          <div className="mt-2 text-sm text-ink-muted">
            Ce mois-ci : <b className="text-ink-fg tabular">{formatMoney(savedThisMonth, currency)}</b>
            {plannedMonthly > 0 ? <> sur <b className="text-ink-fg tabular">{formatMoney(plannedMonthly, currency)}</b> prévus</> : null}
          </div>
        </section>
      ) : null}

      {goals.length === 0 ? (
        <EmptyState icon="🎯" title="Aucun objectif" description="Un téléphone, un voyage, un fonds d'urgence… MONY calcule combien mettre de côté chaque mois." action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Créer un objectif</Button>} />
      ) : (
        <ul className="flex flex-col gap-3 stagger md:grid md:grid-cols-2 md:items-start">
          {goals.map((g) => {
            const reached = g.state === "reached";
            return (
              <li key={g.goal.id} className={cn("card p-4", reached && "border-positive/40")}>
                <div className="flex items-center gap-3">
                  <IconBubble icon={g.goal.icon} color={reached ? "#22C55E" : "#EAB308"} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{g.goal.name}</div>
                    <div className="text-sm text-fg-muted truncate">
                      Objectif : <span className="tabular font-semibold text-fg">{formatMoney(g.goal.target_amount, g.goal.currency)}</span>
                      {g.goal.target_date ? <> · {formatDate(g.goal.target_date, "MMM yyyy")}</> : null}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold tabular tracking-tight">{formatPercent(g.percent)}</div>
                  </div>
                </div>
                <Progress value={g.percent} color={reached ? "var(--positive)" : "linear-gradient(90deg, var(--accent), var(--accent-2))"} className="mt-3" size="lg" />
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                  {reached ? <Badge tone="positive">Atteint</Badge> : g.state === "behind" ? <Badge tone="warning">En retard</Badge> : g.state === "on_track" ? <Badge tone="info">En bonne voie</Badge> : null}
                  <span className="text-fg-muted">Épargné : <b className="text-fg tabular">{formatMoney(g.saved, currency)}</b></span>
                  {!reached ? <span className="text-fg-muted ml-auto">Reste : <b className="text-fg tabular">{formatMoney(g.remaining, currency)}</b></span> : null}
                </div>
                {!reached && g.requiredMonthly !== null ? (
                  <p className={cn("mt-2 text-[13px] font-semibold", g.state === "behind" ? "text-warning" : "text-fg-muted")}>
                    {g.goal.target_date
                      ? `Mets ${formatMoney(g.requiredMonthly, currency)}/mois de côté pour y arriver d'ici ${formatDate(g.goal.target_date, "MMMM yyyy")}${g.monthsLeft !== null ? ` (${g.monthsLeft} mois)` : ""}.`
                      : `À ${formatMoney(g.requiredMonthly, currency)}/mois, tu y seras dans ${g.monthsLeft} mois.`}
                  </p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  {!reached ? (
                    <Button size="sm" onClick={() => setContrib(g)}><PiggyBank className="h-4 w-4" /> Épargner</Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => archive.execute(g.goal.id)}><Archive className="h-4 w-4" /> Archiver</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setEditing(g)} aria-label="Modifier"><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setToDelete(g)} aria-label="Supprimer" className="ml-auto text-fg-subtle hover:text-negative"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {goals.length > 0 ? <Button variant="outline" full onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nouvel objectif</Button> : null}

      <Sheet open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Modifier l'objectif" : "Nouvel objectif"}>
        <GoalForm key={editing?.goal.id ?? "new"} currency={currency} initial={editing} today={today} onDone={() => { setCreating(false); setEditing(null); }} />
      </Sheet>

      <Sheet open={!!contrib} onClose={() => setContrib(null)} title={contrib ? `Épargner pour ${contrib.goal.name}` : ""}>
        {contrib ? <ContributeForm goal={contrib} currency={currency} today={today} onDone={() => setContrib(null)} /> : null}
      </Sheet>

      <ConfirmSheet open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => toDelete && del.execute(toDelete.goal.id)} loading={del.pending} title="Supprimer cet objectif ?" description="Les montants déjà épargnés resteront dans tes transactions." />
    </div>
  );
}

function GoalForm({ currency, initial, today, onDone }: { currency: Currency; initial: GoalStatus | null; today: string; onDone: () => void }) {
  const g = initial?.goal;
  const [kind, setKind] = useState<GoalKind>(g?.kind ?? "custom");
  const [name, setName] = useState(g?.name ?? "");
  const [icon, setIcon] = useState(g?.icon ?? "🎯");
  const [target, setTarget] = useState(g ? String(g.target_amount) : "");
  const [initialAmount, setInitialAmount] = useState(g ? String(g.initial_amount) : "0");
  const [cur, setCur] = useState<Currency>(g?.currency ?? currency);
  const [date, setDate] = useState(g?.target_date ?? "");
  const [monthly, setMonthly] = useState(g?.monthly_contribution != null ? String(g.monthly_contribution) : "");
  const create = useAction(createGoal, { success: "Objectif créé 🎯", onSuccess: onDone });
  const update = useAction((input: unknown) => updateGoal(g!.id, input), { success: "Objectif modifié", onSuccess: onDone });
  const pending = create.pending || update.pending;
  const fields = g ? update.fields : create.fields;

  // Live estimate of the required monthly amount
  const t = Number(target) || 0;
  const i = Number(initialAmount) || 0;
  let suggested: number | null = null;
  if (t > i && date) {
    const months = Math.max(1, Math.round((new Date(date).getTime() - new Date(today).getTime()) / (30.44 * 864e5)));
    suggested = Math.ceil(((t - i) / months) * 100) / 100;
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = { name, icon, kind, target_amount: target, initial_amount: initialAmount, currency: cur, target_date: date || null, monthly_contribution: monthly || (suggested !== null ? String(suggested) : null) };
        if (g) update.execute(payload);
        else create.execute(payload);
      }}
    >
      <Field label="Type">
        <div className="flex flex-wrap gap-2">
          {GOAL_KINDS.map((k) => (
            <Chip key={k.value} active={kind === k.value} onClick={() => { setKind(k.value); setIcon(k.icon); if (!name && k.value !== "custom") setName(k.label); }}>
              <span>{k.icon}</span> {k.label}
            </Chip>
          ))}
        </div>
      </Field>
      <div className="flex gap-3">
        <Field label="Icône" className="w-20">
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} className="text-center text-xl" />
        </Field>
        <Field label="Nom" error={fields.name} className="flex-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : MacBook" maxLength={60} />
        </Field>
      </div>
      <div className="grid grid-cols-[1fr_1fr_100px] gap-3">
        <Field label="Montant cible" error={fields.target_amount}>
          <Input inputMode="decimal" placeholder="1500" value={target} onChange={(e) => setTarget(e.target.value)} />
        </Field>
        <Field label="Déjà épargné" error={fields.initial_amount}>
          <Input inputMode="decimal" placeholder="0" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} />
        </Field>
        <Field label="Devise">
          <Select value={cur} onChange={(e) => setCur(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date cible" error={fields.target_date} hint="Optionnel">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Par mois" error={fields.monthly_contribution} hint={suggested !== null ? `Suggéré : ${formatMoney(suggested, cur)}` : "Optionnel"}>
          <Input inputMode="decimal" placeholder={suggested !== null ? String(suggested) : "100"} value={monthly} onChange={(e) => setMonthly(e.target.value)} />
        </Field>
      </div>
      <Button type="submit" size="lg" full loading={pending}>{g ? "Enregistrer" : "Créer l'objectif"}</Button>
    </form>
  );
}

function ContributeForm({ goal, currency, today, onDone }: { goal: GoalStatus; currency: Currency; today: string; onDone: () => void }) {
  const [amount, setAmount] = useState(goal.goal.monthly_contribution ? String(goal.goal.monthly_contribution) : "");
  const [cur, setCur] = useState<Currency>(goal.goal.currency ?? currency);
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const save = useAction(contributeToGoal, { success: "Épargne enregistrée 🎯", onSuccess: onDone });
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.execute({ goal_id: goal.goal.id, amount, currency: cur, date, payment_method: method });
      }}
    >
      <p className="text-sm text-fg-muted">Il te reste <b className="text-fg tabular">{formatMoney(goal.remaining, currency)}</b> pour atteindre cet objectif.</p>
      <div className="grid grid-cols-[1fr_100px] gap-3">
        <Field label="Montant" error={save.fields.amount}>
          <Input inputMode="decimal" placeholder="100" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </Field>
        <Field label="Devise">
          <Select value={cur} onChange={(e) => setCur(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Depuis">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
          </Select>
        </Field>
      </div>
      <Button type="submit" size="lg" full loading={save.pending} variant="accent">Mettre de côté</Button>
    </form>
  );
}
