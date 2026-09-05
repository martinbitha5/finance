"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Copy, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { Category, IncomeSource, SavingsGoal, Transaction } from "@/lib/finance/types";
import { CURRENCIES, PAYMENT_METHODS, type Currency, type PaymentMethod, type TransactionType } from "@/lib/constants";
import { formatDayLabel, formatMoney, formatDate } from "@/lib/format";
import { convert } from "@/lib/finance/currency";
import { deleteTransaction, duplicateTransaction } from "@/actions/transactions";
import { useAction } from "@/hooks/use-action";
import { useFinanceOptional } from "@/components/finance/finance-provider";
import { TransactionItem } from "./transaction-item";
import { TransactionForm } from "./transaction-form";
import { Sheet, ConfirmSheet } from "@/components/ui/sheet";
import { Chip } from "@/components/ui/segmented";
import { Input, Select, inputClass } from "@/components/ui/field";
import { EmptyState, IconBubble } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
  categories: Category[];
  goals: SavingsGoal[];
  incomeSources: IncomeSource[];
  currency: Currency;
  rates: Record<Currency, number>;
  today: string;
  initialCategory?: string;
}

export function TransactionsList(p: Props) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<TransactionType | "all">("all");
  const [category, setCategory] = useState<string>(p.initialCategory ?? "all");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [month, setMonth] = useState<string>("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showFilters, setShowFilters] = useState(!!p.initialCategory);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categoryById = useMemo(() => new Map(p.categories.map((c) => [c.id, c])), [p.categories]);
  const months = useMemo(() => Array.from(new Set(p.transactions.map((t) => t.date.slice(0, 7)))).sort().reverse(), [p.transactions]);

  const store = useFinanceOptional();
  const del = useAction(deleteTransaction, { success: "Transaction supprimée", onError: () => void store?.refresh() });
  function removeSelected() {
    if (!selected) return toast.error("Aucune transaction");
    const id = selected.id;
    // Disappears immediately; the server's fresh copy confirms (or the refresh restores it on error).
    store?.patch((raw) => ({ ...raw, transactions: raw.transactions.filter((t) => t.id !== id) }));
    setConfirmDelete(false);
    setSelected(null);
    void del.execute(id);
  }
  const dup = useAction((id: string) => duplicateTransaction(id, p.today), { success: "Dupliquée pour aujourd'hui", onSuccess: () => setSelected(null) });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const min = minAmount ? Number(minAmount) : null;
    const max = maxAmount ? Number(maxAmount) : null;
    return p.transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (category !== "all" && t.category_id !== category) return false;
      if (method !== "all" && t.payment_method !== method) return false;
      if (month !== "all" && !t.date.startsWith(month)) return false;
      const base = convert(t.amount, t.currency, p.currency, p.rates);
      if (min !== null && base < min) return false;
      if (max !== null && base > max) return false;
      if (needle) {
        const cat = t.category_id ? categoryById.get(t.category_id)?.name ?? "" : "";
        if (!`${t.description} ${cat} ${t.notes ?? ""}`.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [p.transactions, p.currency, p.rates, q, type, category, method, month, minAmount, maxAmount, categoryById]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) map.set(t.date, [...(map.get(t.date) ?? []), t]);
    return Array.from(map.entries());
  }, [filtered]);

  const totals = useMemo(() => {
    let inc = 0, exp = 0;
    for (const t of filtered) {
      const b = convert(t.amount, t.currency, p.currency, p.rates);
      if (t.type === "income") inc += b;
      else exp += b;
    }
    return { inc, exp };
  }, [filtered, p.currency, p.rates]);

  const activeFilters = [type !== "all", category !== "all", method !== "all", month !== "all", !!minAmount, !!maxAmount].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className={cn(inputClass, "pl-10 h-11")} />
          {q ? <button type="button" onClick={() => setQ("")} aria-label="Effacer" className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle"><X className="h-4 w-4" /></button> : null}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={cn("relative h-11 w-11 rounded-2xl inline-flex items-center justify-center press border", showFilters ? "bg-ink text-ink-fg border-ink dark:bg-fg dark:text-bg" : "bg-surface border-border")}
          aria-label="Filtres"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
          {activeFilters > 0 ? <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-fg text-[10px] font-bold inline-flex items-center justify-center">{activeFilters}</span> : null}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {([["all", "Tout"], ["expense", "Dépenses"], ["income", "Revenus"], ["saving", "Épargne"]] as const).map(([v, l]) => (
          <Chip key={v} active={type === v} onClick={() => setType(v)}>{l}</Chip>
        ))}
      </div>

      {showFilters ? (
        <div className="card p-4 grid grid-cols-2 gap-3 animate-fade-in">
          <label className="col-span-2 sm:col-span-1">
            <span className="block text-[12px] font-semibold text-fg-muted mb-1 px-1">Catégorie</span>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">Toutes</option>
              {p.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </Select>
          </label>
          <label className="col-span-2 sm:col-span-1">
            <span className="block text-[12px] font-semibold text-fg-muted mb-1 px-1">Mois</span>
            <Select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">Tous</option>
              {months.map((m) => <option key={m} value={m}>{formatDate(`${m}-01`, "MMMM yyyy")}</option>)}
            </Select>
          </label>
          <label className="col-span-2 sm:col-span-1">
            <span className="block text-[12px] font-semibold text-fg-muted mb-1 px-1">Moyen de paiement</span>
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | "all")}>
              <option value="all">Tous</option>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
            </Select>
          </label>
          <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
            <label>
              <span className="block text-[12px] font-semibold text-fg-muted mb-1 px-1">Min</span>
              <Input inputMode="decimal" placeholder="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            </label>
            <label>
              <span className="block text-[12px] font-semibold text-fg-muted mb-1 px-1">Max</span>
              <Input inputMode="decimal" placeholder="∞" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
            </label>
          </div>
          {activeFilters > 0 ? (
            <button type="button" onClick={() => { setType("all"); setCategory("all"); setMethod("all"); setMonth("all"); setMinAmount(""); setMaxAmount(""); }} className="col-span-2 text-sm font-semibold text-fg-muted hover:text-fg">
              Réinitialiser les filtres
            </button>
          ) : null}
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="flex justify-between px-1 text-xs font-semibold text-fg-muted">
          <span>{filtered.length} transaction{filtered.length > 1 ? "s" : ""}</span>
          <span className="tabular">
            <span className="text-positive">+{formatMoney(totals.inc, p.currency)}</span> · <span className="text-negative">-{formatMoney(totals.exp, p.currency)}</span>
          </span>
        </div>
      ) : null}

      {groups.length === 0 ? (
        <EmptyState icon="🧾" title="Aucune transaction" description={p.transactions.length === 0 ? "Ajoute ta première dépense pour commencer." : "Essaie d'autres filtres."} action={p.transactions.length === 0 ? <Button href="/ajouter">Ajouter une dépense</Button> : undefined} />
      ) : (
        groups.map(([date, items]) => (
          <section key={date}>
            <h3 className="px-1 mb-1.5 text-[12px] font-bold uppercase tracking-wider text-fg-subtle capitalize">{formatDayLabel(date)}</h3>
            <div className="card p-0 overflow-hidden divide-y divide-border">
              {items.map((t) => (
                <TransactionItem key={t.id} tx={t} category={t.category_id ? categoryById.get(t.category_id) : null} currency={p.currency} rates={p.rates} onClick={() => setSelected(t)} />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Detail sheet */}
      <Sheet open={!!selected && !editing} onClose={() => setSelected(null)} title="Transaction">
        {selected ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <IconBubble
                icon={selected.type === "saving" ? "🎯" : categoryById.get(selected.category_id ?? "")?.icon ?? (selected.type === "income" ? "💰" : "💳")}
                color={selected.type === "saving" ? "#EAB308" : categoryById.get(selected.category_id ?? "")?.color}
                size="lg"
              />
              <div className="min-w-0">
                <div className="text-lg font-bold truncate">{selected.description || categoryById.get(selected.category_id ?? "")?.name || "—"}</div>
                <div className="text-sm text-fg-muted">{formatDate(selected.date, "EEEE d MMMM yyyy")}</div>
              </div>
              <div className={cn("ml-auto text-xl font-extrabold tabular whitespace-nowrap", selected.type === "income" ? "text-positive" : "")}>
                {selected.type === "income" ? "+" : "-"}{formatMoney(selected.amount, selected.currency)}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-surface-2/70 p-3"><dt className="text-xs text-fg-muted">Catégorie</dt><dd className="font-semibold">{categoryById.get(selected.category_id ?? "")?.name ?? "—"}</dd></div>
              <div className="rounded-2xl bg-surface-2/70 p-3"><dt className="text-xs text-fg-muted">Paiement</dt><dd className="font-semibold">{PAYMENT_METHODS.find((m) => m.value === selected.payment_method)?.label}</dd></div>
              <div className="rounded-2xl bg-surface-2/70 p-3"><dt className="text-xs text-fg-muted">Type</dt><dd className="font-semibold">{selected.type === "expense" ? "Dépense" : selected.type === "income" ? "Revenu" : "Épargne"}</dd></div>
              <div className="rounded-2xl bg-surface-2/70 p-3"><dt className="text-xs text-fg-muted">Devise</dt><dd className="font-semibold">{CURRENCIES.find((c) => c.code === selected.currency)?.label}</dd></div>
            </dl>
            {selected.notes ? <p className="text-sm text-fg-muted">{selected.notes}</p> : null}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Modifier</Button>
              <Button variant="secondary" loading={dup.pending} onClick={() => dup.execute(selected.id)}><Copy className="h-4 w-4" /> Dupliquer</Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" /> Supprimer</Button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet open={!!selected && editing} onClose={() => setEditing(false)} title="Modifier la transaction">
        {selected ? (
          <TransactionForm
            key={selected.id}
            categories={p.categories}
            goals={p.goals}
            incomeSources={p.incomeSources}
            defaultCurrency={p.currency}
            today={p.today}
            initial={selected}
            onDone={() => { setEditing(false); setSelected(null); }}
          />
        ) : null}
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={removeSelected}
        loading={del.pending}
        title="Supprimer cette transaction ?"
        description="Cette action est définitive."
      />
    </div>
  );
}
