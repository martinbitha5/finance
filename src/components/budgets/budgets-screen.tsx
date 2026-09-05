"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import type { BudgetStatus, Category } from "@/lib/finance/types";
import { CURRENCIES, type Currency } from "@/lib/constants";
import { formatMoney, formatPercent } from "@/lib/format";
import { deleteBudget, upsertBudget } from "@/actions/budgets";
import { useAction } from "@/hooks/use-action";
import { Sheet, ConfirmSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState, IconBubble, Progress, Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function BudgetsScreen({ budgets, categories, currency, totalSpent, monthLabel }: { budgets: BudgetStatus[]; categories: Category[]; currency: Currency; totalSpent: number; monthLabel: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetStatus | null>(null);
  const [toDelete, setToDelete] = useState<BudgetStatus | null>(null);
  const del = useAction(deleteBudget, { success: "Budget supprimé", onSuccess: () => setToDelete(null) });

  const totalBudget = budgets.reduce((a, b) => a + b.amount, 0);
  const budgetedSpent = budgets.reduce((a, b) => a + b.spent, 0);
  const usedCategoryIds = new Set(budgets.map((b) => b.budget.category_id));
  const available = categories.filter((c) => c.kind === "expense" && !usedCategoryIds.has(c.id));

  return (
    <div className="flex flex-col gap-4">
      {budgets.length > 0 ? (
        <section className="card p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[12px] font-semibold text-fg-muted">Budgets · {monthLabel}</div>
              <div className="text-2xl font-extrabold tabular tracking-tight mt-0.5">
                {formatMoney(budgetedSpent, currency)} <span className="text-base text-fg-muted font-semibold">/ {formatMoney(totalBudget, currency)}</span>
              </div>
            </div>
            <Badge tone={budgetedSpent > totalBudget ? "negative" : budgetedSpent / totalBudget >= 0.8 ? "warning" : "positive"}>
              {formatPercent(totalBudget > 0 ? (budgetedSpent / totalBudget) * 100 : 0)}
            </Badge>
          </div>
          <Progress value={totalBudget > 0 ? (budgetedSpent / totalBudget) * 100 : 0} color={budgetedSpent > totalBudget ? "var(--negative)" : "var(--fg)"} className="mt-3" />
          {totalSpent > budgetedSpent ? (
            <p className="text-xs text-fg-subtle mt-2">+ {formatMoney(totalSpent - budgetedSpent, currency)} dépensés dans des catégories sans budget.</p>
          ) : null}
        </section>
      ) : null}

      {budgets.length === 0 ? (
        <EmptyState icon="🎚️" title="Aucun budget" description="Fixe une limite par catégorie et MONY te préviendra quand tu t'en approches." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Créer un budget</Button>} />
      ) : (
        <ul className="flex flex-col gap-3 stagger">
          {budgets.map((b) => (
            <li key={b.budget.id} className="card p-4">
              <button type="button" className="w-full text-left" onClick={() => setEditing(b)}>
                <div className="flex items-center gap-3">
                  <IconBubble icon={b.category?.icon ?? "💳"} color={b.category?.color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <span className="font-bold truncate">{b.category?.name ?? "Catégorie"}</span>
                      <span className="tabular font-bold whitespace-nowrap">
                        {formatMoney(b.spent, currency)} <span className="text-fg-muted font-semibold">/ {formatMoney(b.amount, currency)}</span>
                      </span>
                    </div>
                    <Progress value={b.percent} color={b.state === "exceeded" ? "var(--negative)" : b.state === "warning" ? "var(--warning)" : b.category?.color} className="mt-2" />
                  </div>
                </div>
                <div className={cn("mt-2.5 text-[13px] font-semibold pl-14", b.state === "exceeded" ? "text-negative" : b.state === "warning" ? "text-warning" : "text-fg-muted")}>
                  {b.state === "exceeded"
                    ? `🔴 Budget ${b.category?.name.toLowerCase()} dépassé de ${formatMoney(Math.abs(b.remaining), currency)}.`
                    : b.state === "warning"
                      ? `⚠️ Il te reste seulement ${formatMoney(b.remaining, currency)} pour ${b.category?.name.toLowerCase()}.`
                      : `Il te reste ${formatMoney(b.remaining, currency)} · ${formatPercent(b.percent)} utilisé`}
                </div>
              </button>
              <div className="mt-2 pl-14 flex gap-3 text-xs font-semibold text-fg-muted">
                <Link href={`/transactions?categorie=${b.budget.category_id}`} className="hover:text-fg">Voir les dépenses</Link>
                <button type="button" onClick={() => setToDelete(b)} className="hover:text-negative inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {budgets.length > 0 ? (
        <Button variant="outline" full onClick={() => setOpen(true)} disabled={available.length === 0}>
          <Plus className="h-4 w-4" /> Ajouter un budget
        </Button>
      ) : null}

      <Sheet open={open || !!editing} onClose={() => { setOpen(false); setEditing(null); }} title={editing ? "Modifier le budget" : "Nouveau budget"}>
        <BudgetForm
          key={editing?.budget.id ?? "new"}
          categories={editing ? categories : available}
          currency={currency}
          initial={editing}
          onDone={() => { setOpen(false); setEditing(null); }}
        />
      </Sheet>

      <ConfirmSheet open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => toDelete && del.execute(toDelete.budget.id)} loading={del.pending} title="Supprimer ce budget ?" description="Les transactions ne sont pas affectées." />
    </div>
  );
}

function BudgetForm({ categories, currency, initial, onDone }: { categories: Category[]; currency: Currency; initial: BudgetStatus | null; onDone: () => void }) {
  const [categoryId, setCategoryId] = useState(initial?.budget.category_id ?? categories[0]?.id ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.budget.amount) : "");
  const [cur, setCur] = useState<Currency>(initial?.budget.currency ?? currency);
  const [threshold, setThreshold] = useState(String(initial?.budget.alert_threshold ?? 80));
  const save = useAction(upsertBudget, { success: initial ? "Budget modifié" : "Budget créé", onSuccess: onDone });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.execute({ category_id: categoryId, amount, currency: cur, alert_threshold: threshold });
      }}
    >
      <Field label="Catégorie" error={save.fields.category_id}>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={!!initial}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <Field label="Montant par mois" error={save.fields.amount}>
          <Input inputMode="decimal" placeholder="120" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </Field>
        <Field label="Devise">
          <Select value={cur} onChange={(e) => setCur(e.target.value as Currency)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Alerte à partir de" hint="Tu seras prévenu quand ce pourcentage est atteint.">
        <div className="flex items-center gap-3">
          <input type="range" min={50} max={100} step={5} value={threshold} onChange={(e) => setThreshold(e.target.value)} className="flex-1 accent-[var(--fg)]" />
          <span className="tabular font-bold w-12 text-right">{threshold} %</span>
        </div>
      </Field>
      <Button type="submit" size="lg" full loading={save.pending}>{initial ? "Enregistrer" : "Créer le budget"}</Button>
    </form>
  );
}
