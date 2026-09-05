"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { addDays, parseISO } from "date-fns";
import { createTransaction, updateTransaction } from "@/actions/transactions";
import { useAction } from "@/hooks/use-action";
import { useFinanceOptional } from "@/components/finance/finance-provider";
import { CURRENCIES, PAYMENT_METHODS, type Currency, type PaymentMethod, type TransactionType } from "@/lib/constants";
import type { Category, IncomeSource, SavingsGoal, Transaction } from "@/lib/finance/types";
import { currencySymbol, toISODate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { AmountInput, Field, Input, Select } from "@/components/ui/field";
import { Chip, Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { CategoryForm } from "@/components/categories/category-form";
import { cn } from "@/lib/utils";

export interface TransactionFormProps {
  categories: Category[];
  goals: SavingsGoal[];
  incomeSources: IncomeSource[];
  defaultCurrency: Currency;
  today: string;
  initial?: Transaction;
  initialType?: TransactionType;
  recentDescriptions?: string[];
  onDone?: () => void;
  submitLabel?: string;
}

const TYPE_OPTIONS: { value: TransactionType; label: string; icon: string }[] = [
  { value: "expense", label: "Dépense", icon: "💸" },
  { value: "income", label: "Revenu", icon: "💰" },
  { value: "saving", label: "Épargne", icon: "🎯" },
];

export function TransactionForm(p: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(p.initial?.type ?? p.initialType ?? "expense");
  const [amount, setAmount] = useState(p.initial ? String(p.initial.amount) : "");
  const [currency, setCurrency] = useState<Currency>(p.initial?.currency ?? p.defaultCurrency);
  const [categoryId, setCategoryId] = useState<string | null>(p.initial?.category_id ?? null);
  const [description, setDescription] = useState(p.initial?.description ?? "");
  const [date, setDate] = useState(p.initial?.date ?? p.today);
  const [method, setMethod] = useState<PaymentMethod>(p.initial?.payment_method ?? "cash");
  const [goalId, setGoalId] = useState<string | null>(p.initial?.savings_goal_id ?? p.goals[0]?.id ?? null);
  const [incomeId, setIncomeId] = useState<string | null>(p.initial?.income_id ?? null);
  const [newCat, setNewCat] = useState(false);

  const store = useFinanceOptional();
  // New entries are shown on the device before the server confirms (see submit()).
  const optimistic = !p.initial && !!store?.raw;
  const create = useAction(createTransaction, {
    success: "Enregistré ✓",
    onSuccess: () => {
      if (!optimistic) p.onDone?.();
    },
    onError: () => void store?.refresh(),
  });
  const update = useAction((input: unknown) => updateTransaction(p.initial!.id, input), { success: "Modifié ✓", onSuccess: () => p.onDone?.() });
  const pending = create.pending || update.pending;
  const fields = p.initial ? update.fields : create.fields;

  const visibleCategories = useMemo(() => p.categories.filter((c) => c.kind === (type === "saving" ? "saving" : type)), [p.categories, type]);
  const activeGoals = p.goals.filter((g) => !g.is_archived);
  const activeSources = p.incomeSources.filter((s) => s.is_active);
  const symbol = currencySymbol(currency);

  const amountNumber = Number(amount);
  const valid = amountNumber > 0 && (type !== "expense" || categoryId);

  function submit() {
    const payload = {
      type,
      amount: amountNumber,
      currency,
      category_id: type === "expense" ? categoryId : type === "income" ? categoryId : null,
      description: description.trim(),
      date,
      payment_method: method,
      savings_goal_id: type === "saving" ? goalId : null,
      income_id: type === "income" ? incomeId : null,
      account_id: null,
      debt_id: p.initial?.debt_id ?? null,
    };
    if (p.initial) {
      update.execute(payload);
      return;
    }
    if (optimistic && store?.raw) {
      // Show it immediately and move on; the server's fresh copy replaces this row when it lands.
      const now = new Date().toISOString();
      const temp: Transaction = {
        id: `tmp-${Date.now()}`,
        user_id: store.raw.userId,
        type,
        amount: amountNumber,
        currency,
        category_id: payload.category_id,
        description: payload.description,
        date,
        payment_method: method,
        savings_goal_id: payload.savings_goal_id,
        income_id: payload.income_id,
        account_id: null,
        debt_id: null,
        recurring_expense_id: null,
        notes: null,
        is_demo: false,
        created_at: now,
        updated_at: now,
      };
      store.patch((raw) => ({ ...raw, transactions: [temp, ...raw.transactions] }));
      p.onDone?.();
    }
    create.execute(payload);
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) submit();
      }}
    >
      {!p.initial ? <Segmented value={type} onChange={(t) => { setType(t); setCategoryId(null); if (t === "saving") setMethod("transfer"); }} options={TYPE_OPTIONS} /> : null}

      <div className="py-3">
        <AmountInput value={amount} onChange={setAmount} symbol={symbol} autoFocus={!p.initial} />
        {fields.amount ? <p className="text-center text-xs text-negative mt-1">{fields.amount}</p> : null}
        <div className="mt-3 flex justify-center gap-1.5">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCurrency(c.code)}
              className={cn("h-7 px-2.5 rounded-full text-[11px] font-bold press", currency === c.code ? "bg-ink text-ink-fg dark:bg-fg dark:text-bg" : "bg-surface-2 text-fg-muted")}
            >
              {c.code}
            </button>
          ))}
        </div>
      </div>

      {type === "saving" ? (
        <Field label="Objectif" error={fields.savings_goal_id}>
          {activeGoals.length === 0 ? (
            <p className="text-sm text-fg-muted px-1">Aucun objectif. L&apos;épargne sera enregistrée sans objectif.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeGoals.map((g) => (
                <Chip key={g.id} active={goalId === g.id} onClick={() => setGoalId(g.id)}>
                  <span>{g.icon}</span> {g.name}
                </Chip>
              ))}
            </div>
          )}
        </Field>
      ) : null}

      {type === "income" && activeSources.length > 0 ? (
        <Field label="Source">
          <div className="flex flex-wrap gap-2">
            {activeSources.map((s) => (
              <Chip key={s.id} active={incomeId === s.id} onClick={() => { setIncomeId(incomeId === s.id ? null : s.id); if (!description) setDescription(s.label); }}>
                {s.label}
              </Chip>
            ))}
          </div>
        </Field>
      ) : null}

      {type !== "saving" ? (
        <Field label="Catégorie" error={fields.category_id ?? (type === "expense" && !categoryId && amountNumber > 0 ? "Choisis une catégorie" : undefined)}>
          <div className="grid grid-cols-4 gap-2">
            {visibleCategories.map((c) => {
              const active = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl py-2.5 px-1 border transition-all press",
                    active ? "border-transparent text-white shadow-soft" : "bg-surface border-border hover:border-border-strong",
                  )}
                  style={active ? { background: c.color } : undefined}
                >
                  <span className="text-xl leading-none">{c.icon}</span>
                  <span className={cn("text-[11px] font-semibold leading-tight text-center line-clamp-1", !active && "text-fg-muted")}>{c.name}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setNewCat(true)}
              className="flex flex-col items-center gap-1 rounded-2xl py-2.5 px-1 border border-dashed border-border-strong text-fg-muted hover:text-fg press"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[11px] font-semibold">Nouvelle</span>
            </button>
          </div>
        </Field>
      ) : null}

      <Field label="Description" error={fields.description}>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "expense" ? "Ex : Restaurant" : type === "income" ? "Ex : Salaire" : "Ex : Épargne du mois"} maxLength={120} />
        {p.recentDescriptions && p.recentDescriptions.length > 0 && !description ? (
          <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {p.recentDescriptions.slice(0, 8).map((d) => (
              <button key={d} type="button" onClick={() => setDescription(d)} className="shrink-0 h-8 px-3 rounded-full bg-surface-2 text-xs font-semibold text-fg-muted hover:text-fg press">
                {d}
              </button>
            ))}
          </div>
        ) : null}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" error={fields.date}>
          <Input type="date" value={date} max={toISODate(addDays(parseISO(p.today), 366))} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Moyen de paiement">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.icon} {m.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Button type="submit" size="lg" full loading={pending} disabled={!valid} variant={type === "income" ? "accent" : "primary"} className="mt-1">
        {p.submitLabel ?? (p.initial ? "Enregistrer" : type === "expense" ? "Ajouter la dépense" : type === "income" ? "Ajouter le revenu" : "Mettre de côté")}
      </Button>

      <Sheet open={newCat} onClose={() => setNewCat(false)} title="Nouvelle catégorie">
        <CategoryForm
          kind={type === "income" ? "income" : "expense"}
          onDone={(id) => {
            setNewCat(false);
            if (id) setCategoryId(id);
          }}
        />
      </Sheet>
    </form>
  );
}
