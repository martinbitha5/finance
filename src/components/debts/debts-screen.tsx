"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, RotateCcw, HandCoins, History } from "lucide-react";
import type { DebtStatus, Transaction } from "@/lib/finance/types";
import { CURRENCIES, PAYMENT_METHODS, type Currency, type PaymentMethod } from "@/lib/constants";
import type { Enums } from "@/lib/supabase/database.types";
import { formatMoney, formatPercent, formatDate } from "@/lib/format";
import { createDebt, deleteDebt, payDebt, setDebtSettled, updateDebt } from "@/actions/debts";
import { useAction } from "@/hooks/use-action";
import { Sheet, ConfirmSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Badge, EmptyState, IconBubble, Progress, Toggle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Direction = Enums<"debt_direction">;

const DIRECTION_OPTIONS: { value: Direction; label: string; icon: string }[] = [
  { value: "owed", label: "Je dois", icon: "🧾" },
  { value: "lent", label: "On me doit", icon: "🤝" },
];

function stateBadge(d: DebtStatus) {
  switch (d.state) {
    case "settled":
      return <Badge tone="positive">Liquidée</Badge>;
    case "overdue":
      return <Badge tone="negative">En retard</Badge>;
    case "behind":
      return <Badge tone="warning">Mensualité insuffisante</Badge>;
    case "on_track":
      return <Badge tone="info">En cours</Badge>;
    default:
      return <Badge>Sans échéance</Badge>;
  }
}

function timeline(d: DebtStatus, currency: Currency) {
  if (d.state === "settled") return d.debt.settled_at ? `Liquidée le ${formatDate(d.debt.settled_at, "d MMM yyyy")}.` : "Liquidée.";
  const parts: string[] = [];
  if (d.debt.due_date && d.daysLeft !== null) {
    if (d.daysLeft < 0) parts.push(`Échéance dépassée depuis ${Math.abs(d.daysLeft)} j (${formatDate(d.debt.due_date, "d MMM yyyy")}).`);
    else if (d.daysLeft === 0) parts.push("Échéance aujourd'hui.");
    else parts.push(`Échéance le ${formatDate(d.debt.due_date, "d MMM yyyy")} · dans ${d.daysLeft} j${d.monthsLeft ? ` (${d.monthsLeft} mois)` : ""}.`);
    if (d.requiredMonthly !== null && d.remaining > 0) parts.push(`${formatMoney(d.requiredMonthly, currency)}/mois pour tenir la date.`);
  }
  if (d.monthsAtPlan !== null && d.projectedSettleDate) {
    parts.push(
      d.monthsAtPlan === 0
        ? "Ce cycle devrait la liquider."
        : `À ${formatMoney(d.debt.monthly_payment ?? 0, d.debt.currency)}/mois, liquidée vers ${formatDate(d.projectedSettleDate, "MMM yyyy")} (${d.monthsAtPlan} mois).`,
    );
  }
  if (parts.length === 0) parts.push("Ajoute une échéance ou une mensualité pour voir quand elle sera liquidée.");
  return parts.join(" ");
}

export function DebtsScreen({ debts, transactions, currency, today, totalOwed, totalLent, remainingThisCycle }: { debts: DebtStatus[]; transactions: Transaction[]; currency: Currency; today: string; totalOwed: number; totalLent: number; remainingThisCycle: number }) {
  const [tab, setTab] = useState<"active" | "settled">("active");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<DebtStatus | null>(null);
  const [paying, setPaying] = useState<DebtStatus | null>(null);
  const [detail, setDetail] = useState<DebtStatus | null>(null);
  const [toDelete, setToDelete] = useState<DebtStatus | null>(null);
  const del = useAction(deleteDebt, { success: "Dette supprimée", onSuccess: () => { setToDelete(null); setDetail(null); } });
  const settle = useAction(({ id, v }: { id: string; v: boolean }) => setDebtSettled(id, v, today), { success: "Mis à jour", onSuccess: () => setDetail(null) });

  const shown = debts.filter((d) => (tab === "settled" ? d.state === "settled" : d.state !== "settled"));
  const activeCount = debts.filter((d) => d.state !== "settled").length;
  const settledCount = debts.length - activeCount;

  return (
    <div className="flex flex-col gap-4">
      {debts.length > 0 ? (
        <section className="aurora rounded-4xl p-5 text-ink-fg shadow-float">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">Je dois encore</div>
              <div className="text-2xl font-extrabold tabular tracking-tight mt-1">{formatMoney(totalOwed, currency)}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">On me doit</div>
              <div className="text-2xl font-extrabold tabular tracking-tight mt-1 text-accent">{formatMoney(totalLent, currency)}</div>
            </div>
          </div>
          {remainingThisCycle > 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Mensualités encore à payer avant la paie : <b className="text-ink-fg tabular">{formatMoney(remainingThisCycle, currency)}</b> (déjà retirées de ton montant quotidien).
            </p>
          ) : null}
        </section>
      ) : null}

      {debts.length > 0 ? (
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "active", label: `En cours (${activeCount})` },
            { value: "settled", label: `Liquidées (${settledCount})` },
          ]}
        />
      ) : null}

      {debts.length === 0 ? (
        <EmptyState icon="🧾" title="Aucune dette" description="Enregistre ce que tu dois et ce qu'on te doit. MONY suit les remboursements et te dit quand chaque dette sera liquidée." action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Ajouter une dette</Button>} />
      ) : shown.length === 0 ? (
        <p className="card px-4 py-6 text-sm text-fg-muted text-center">{tab === "settled" ? "Aucune dette liquidée pour l'instant." : "Aucune dette en cours. 🎉"}</p>
      ) : (
        <ul className="flex flex-col gap-3 stagger md:grid md:grid-cols-2 md:items-start">
          {shown.map((d) => {
            const owed = d.debt.direction === "owed";
            const settled = d.state === "settled";
            return (
              <li key={d.debt.id} className={cn("card p-4", d.state === "overdue" && "border-negative/40", settled && "opacity-90")}>
                <button type="button" className="w-full text-left" onClick={() => setDetail(d)}>
                  <div className="flex items-center gap-3">
                    <IconBubble icon={owed ? "🧾" : "🤝"} color={settled ? "#22C55E" : owed ? "#DC2626" : "#0D9488"} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{d.debt.name}</div>
                      <div className="text-sm text-fg-muted truncate">
                        {d.debt.counterparty ? `${owed ? "à" : "par"} ${d.debt.counterparty} · ` : ""}
                        {formatMoney(d.debt.principal, d.debt.currency)} au départ
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn("text-lg font-extrabold tabular tracking-tight", settled ? "text-positive" : owed ? "text-negative" : "text-fg")}>
                        {settled ? "0" : formatMoney(d.remaining, currency)}
                      </div>
                      <div className="text-[11px] text-fg-subtle">{settled ? "liquidée" : "restant"}</div>
                    </div>
                  </div>
                  <Progress value={d.percent} color={settled ? "var(--positive)" : d.state === "overdue" ? "var(--negative)" : owed ? "var(--fg)" : "var(--accent)"} className="mt-3" size="md" />
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                    {stateBadge(d)}
                    <span className="text-fg-muted">{owed ? "Remboursé" : "Récupéré"} : <b className="text-fg tabular">{formatMoney(d.repaid, currency)}</b> · {formatPercent(d.percent)}</span>
                  </div>
                  <p className={cn("mt-2 text-[13px]", d.state === "overdue" ? "text-negative font-semibold" : d.state === "behind" ? "text-warning font-semibold" : "text-fg-muted")}>{timeline(d, currency)}</p>
                </button>
                <div className="mt-3 flex gap-2">
                  {!settled ? (
                    <Button size="sm" onClick={() => setPaying(d)} variant={owed ? "primary" : "accent"}>
                      <HandCoins className="h-4 w-4" /> {owed ? "Rembourser" : "Encaisser"}
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => settle.execute({ id: d.debt.id, v: false })}><RotateCcw className="h-4 w-4" /> Rouvrir</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setEditing(d)} aria-label="Modifier"><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDetail(d)} aria-label="Historique"><History className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setToDelete(d)} aria-label="Supprimer" className="ml-auto text-fg-subtle hover:text-negative"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {debts.length > 0 ? <Button variant="outline" full onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Ajouter une dette</Button> : null}

      <Sheet open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} title={editing ? "Modifier la dette" : "Nouvelle dette"}>
        <DebtForm key={editing?.debt.id ?? "new"} currency={currency} today={today} initial={editing} onDone={() => { setCreating(false); setEditing(null); }} />
      </Sheet>

      <Sheet open={!!paying} onClose={() => setPaying(null)} title={paying ? (paying.debt.direction === "owed" ? `Rembourser · ${paying.debt.name}` : `Encaisser · ${paying.debt.name}`) : ""}>
        {paying ? <PayForm d={paying} currency={currency} today={today} onDone={() => setPaying(null)} /> : null}
      </Sheet>

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail?.debt.name ?? ""}>
        {detail ? <DebtDetail d={detail} transactions={transactions} currency={currency} onSettle={(v) => settle.execute({ id: detail.debt.id, v })} settling={settle.pending} /> : null}
      </Sheet>

      <ConfirmSheet open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => toDelete && del.execute(toDelete.debt.id)} loading={del.pending} title="Supprimer cette dette ?" description="Les remboursements déjà enregistrés restent dans tes transactions." />
    </div>
  );
}

function DebtDetail({ d, transactions, currency, onSettle, settling }: { d: DebtStatus; transactions: Transaction[]; currency: Currency; onSettle: (v: boolean) => void; settling: boolean }) {
  const owed = d.debt.direction === "owed";
  const history = useMemo(() => transactions.filter((t) => t.debt_id === d.debt.id).sort((a, b) => b.date.localeCompare(a.date)), [transactions, d.debt.id]);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-2xl bg-surface-2/70 p-3"><div className="text-xs text-fg-muted">Départ</div><div className="font-bold tabular">{formatMoney(d.debt.principal, d.debt.currency)}</div></div>
        <div className="rounded-2xl bg-surface-2/70 p-3"><div className="text-xs text-fg-muted">{owed ? "Remboursé" : "Récupéré"}</div><div className="font-bold tabular text-positive">{formatMoney(d.repaid, currency)}</div></div>
        <div className="rounded-2xl bg-surface-2/70 p-3"><div className="text-xs text-fg-muted">Restant</div><div className={cn("font-bold tabular", d.remaining > 0 && owed && "text-negative")}>{formatMoney(d.remaining, currency)}</div></div>
      </div>
      <p className="text-sm text-fg-muted">{timeline(d, currency)}</p>
      {d.debt.notes ? <p className="text-sm text-fg-muted italic">{d.debt.notes}</p> : null}
      <div>
        <h3 className="text-[12px] font-bold uppercase tracking-wider text-fg-subtle mb-1.5 px-1">Historique</h3>
        {history.length === 0 ? (
          <p className="text-sm text-fg-muted px-1">Aucun mouvement enregistré.</p>
        ) : (
          <ul className="card p-0 overflow-hidden divide-y divide-border">
            {history.map((t) => {
              const isRepayment = t.type === (owed ? "expense" : "income");
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span aria-hidden>{isRepayment ? (owed ? "↩️" : "✅") : owed ? "💵" : "📤"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{t.description}</div>
                    <div className="text-xs text-fg-muted">{formatDate(t.date, "d MMM yyyy")}</div>
                  </div>
                  <span className={cn("tabular font-bold", isRepayment ? "text-positive" : "text-fg-muted")}>{isRepayment ? "" : owed ? "+" : "-"}{formatMoney(t.amount, t.currency)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {d.state !== "settled" ? (
        <Button variant="secondary" full loading={settling} onClick={() => onSettle(true)}>
          <CheckCircle2 className="h-4 w-4" /> Marquer comme liquidée{d.remaining > 0 ? ` (reste ${formatMoney(d.remaining, currency)} abandonné)` : ""}
        </Button>
      ) : null}
    </div>
  );
}

function DebtForm({ currency, today, initial, onDone }: { currency: Currency; today: string; initial: DebtStatus | null; onDone: () => void }) {
  const d = initial?.debt;
  const [direction, setDirection] = useState<Direction>(d?.direction ?? "owed");
  const [name, setName] = useState(d?.name ?? "");
  const [counterparty, setCounterparty] = useState(d?.counterparty ?? "");
  const [principal, setPrincipal] = useState(d ? String(d.principal) : "");
  const [cur, setCur] = useState<Currency>(d?.currency ?? currency);
  const [startDate, setStartDate] = useState(d?.start_date ?? today);
  const [dueDate, setDueDate] = useState(d?.due_date ?? "");
  const [monthly, setMonthly] = useState(d?.monthly_payment != null ? String(d.monthly_payment) : "");
  const [notes, setNotes] = useState(d?.notes ?? "");
  const [recordDisbursement, setRecordDisbursement] = useState(true);
  const [alreadyRepaid, setAlreadyRepaid] = useState("0");
  const create = useAction(createDebt, { success: "Dette ajoutée", onSuccess: onDone });
  const update = useAction((input: unknown) => updateDebt(d!.id, input), { success: "Dette modifiée", onSuccess: onDone });
  const pending = create.pending || update.pending;
  const fields = d ? update.fields : create.fields;

  const p = Number(principal) || 0;
  const repaidNum = Number(alreadyRepaid) || 0;
  let suggested: number | null = null;
  if (p > repaidNum && dueDate) {
    const months = Math.max(1, Math.round((new Date(dueDate).getTime() - new Date(today).getTime()) / (30.44 * 864e5)));
    suggested = Math.ceil(((p - repaidNum) / months) * 100) / 100;
  }
  const owed = direction === "owed";

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const payload = { direction, name, counterparty, principal, currency: cur, start_date: startDate, due_date: dueDate || null, monthly_payment: monthly || (suggested !== null ? String(suggested) : null), notes };
        if (d) update.execute(payload);
        else create.execute({ ...payload, record_disbursement: recordDisbursement, already_repaid: alreadyRepaid });
      }}
    >
      {!d ? <Segmented value={direction} onChange={setDirection} options={DIRECTION_OPTIONS} /> : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom" error={fields.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={owed ? "Ex : Prêt moto" : "Ex : Avance à Jean"} autoFocus maxLength={60} />
        </Field>
        <Field label={owed ? "Créancier" : "Emprunteur"} error={fields.counterparty}>
          <Input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Ex : Maman, banque…" maxLength={60} />
        </Field>
      </div>
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <Field label="Montant total" error={fields.principal}>
          <Input inputMode="decimal" placeholder="200" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        </Field>
        <Field label="Devise">
          <Select value={cur} onChange={(e) => setCur(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date de début" error={fields.start_date}>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Échéance" error={fields.due_date} hint="Optionnel">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
      </div>
      <Field label={owed ? "Mensualité prévue" : "Remboursement mensuel attendu"} error={fields.monthly_payment} hint={suggested !== null ? `Suggéré pour tenir l'échéance : ${formatMoney(suggested, cur)}/mois` : "Optionnel. Retirée de ton montant quotidien chaque cycle."}>
        <Input inputMode="decimal" placeholder={suggested !== null ? String(suggested) : "50"} value={monthly} onChange={(e) => setMonthly(e.target.value)} />
      </Field>
      {!d ? (
        <>
          <div className="flex items-center justify-between rounded-2xl bg-surface-2/70 px-4 py-3 gap-3">
            <div>
              <div className="text-sm font-semibold">{owed ? "J'ai reçu cet argent sur mon solde" : "J'ai sorti cet argent de mon solde"}</div>
              <div className="text-xs text-fg-muted">{owed ? "Ajoute un revenu « Emprunt » à la date de début." : "Ajoute une dépense « Prêt » à la date de début."}</div>
            </div>
            <Toggle checked={recordDisbursement} onChange={setRecordDisbursement} label="Enregistrer le mouvement" />
          </div>
          <Field label={owed ? "Déjà remboursé" : "Déjà récupéré"} hint="Si la dette a commencé avant MONY." error={fields.already_repaid}>
            <Input inputMode="decimal" value={alreadyRepaid} onChange={(e) => setAlreadyRepaid(e.target.value)} />
          </Field>
        </>
      ) : null}
      <Field label="Notes" error={fields.notes}>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions, rappels…" maxLength={500} className="min-h-16" />
      </Field>
      <Button type="submit" size="lg" full loading={pending}>{d ? "Enregistrer" : "Ajouter la dette"}</Button>
    </form>
  );
}

function PayForm({ d, currency, today, onDone }: { d: DebtStatus; currency: Currency; today: string; onDone: () => void }) {
  const owed = d.debt.direction === "owed";
  const defaultAmount = d.debt.monthly_payment ? Math.min(d.debt.monthly_payment, d.remaining) : d.remaining;
  const [amount, setAmount] = useState(defaultAmount > 0 ? String(Math.round(defaultAmount * 100) / 100) : "");
  const [cur, setCur] = useState<Currency>(d.debt.currency);
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const pay = useAction(payDebt, { onSuccess: (r) => onDone() ?? r });
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        pay.execute({ debt_id: d.debt.id, amount, currency: cur, date, payment_method: method });
      }}
    >
      <p className="text-sm text-fg-muted">
        Il reste <b className="text-fg tabular">{formatMoney(d.remaining, currency)}</b> {owed ? "à rembourser" : "à récupérer"}.
      </p>
      <div className="flex gap-2">
        {d.debt.monthly_payment ? <Button type="button" size="sm" variant="secondary" onClick={() => setAmount(String(Math.min(d.debt.monthly_payment!, d.remaining)))}>Mensualité</Button> : null}
        <Button type="button" size="sm" variant="secondary" onClick={() => { setAmount(String(d.remaining)); setCur(currency); }}>Tout ({formatMoney(d.remaining, currency)})</Button>
      </div>
      <div className="grid grid-cols-[1fr_100px] gap-3">
        <Field label="Montant" error={pay.fields.amount}>
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </Field>
        <Field label="Devise">
          <Select value={cur} onChange={(e) => setCur(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Moyen">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
          </Select>
        </Field>
      </div>
      <p className="text-xs text-fg-subtle">{owed ? "Enregistré comme dépense « Dettes »." : "Enregistré comme revenu « Remboursement reçu »."}</p>
      <Button type="submit" size="lg" full loading={pay.pending} variant={owed ? "primary" : "accent"}>{owed ? "Enregistrer le remboursement" : "Enregistrer l'encaissement"}</Button>
    </form>
  );
}
