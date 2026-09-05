import type { Category, Debt, SavingsGoal, Transaction } from "@/lib/finance/types";
import { PAYMENT_METHODS } from "@/lib/constants";

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Builds a semicolon-separated CSV (opens directly in Excel / Numbers with French locales). */
export function transactionsToCsv(transactions: Transaction[], categories: Category[], goals: SavingsGoal[], debts: Debt[]): string {
  const cat = new Map(categories.map((c) => [c.id, c.name]));
  const goal = new Map(goals.map((g) => [g.id, g.name]));
  const debt = new Map(debts.map((d) => [d.id, d.name]));
  const method = new Map(PAYMENT_METHODS.map((m) => [m.value, m.label]));
  const typeLabel = { expense: "Dépense", income: "Revenu", saving: "Épargne" } as const;
  const header = ["Date", "Type", "Montant", "Devise", "Catégorie", "Description", "Moyen de paiement", "Objectif", "Dette", "Notes"];
  const rows = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) =>
      [
        t.date,
        typeLabel[t.type],
        (t.type === "income" ? t.amount : -t.amount).toFixed(2).replace(".", ","),
        t.currency,
        t.category_id ? cat.get(t.category_id) ?? "" : "",
        t.description,
        method.get(t.payment_method) ?? t.payment_method,
        t.savings_goal_id ? goal.get(t.savings_goal_id) ?? "" : "",
        t.debt_id ? debt.get(t.debt_id) ?? "" : "",
        t.notes ?? "",
      ]
        .map(esc)
        .join(";"),
    );
  return "﻿" + [header.join(";"), ...rows].join("\r\n");
}

/** Triggers a file download in the browser. */
export function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
