"use client";

import { useSearchParams } from "next/navigation";
import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { AddTransactionScreen } from "@/components/transactions/add-transaction-screen";
import type { TransactionType } from "@/lib/constants";

export function AddView() {
  const { snapshot, summary } = useFinanceData();
  const sp = useSearchParams();
  const requested = sp.get("type") ?? "";
  const type = (["expense", "income", "saving"].includes(requested) ? requested : "expense") as TransactionType;

  const recent = Array.from(
    new Set(
      snapshot.transactions
        .filter((t) => t.type === "expense" && t.description && !t.recurring_expense_id)
        .map((t) => t.description),
    ),
  ).slice(0, 8);

  return (
    <div>
      <PageHeader title="Ajouter" question="En quelques secondes." />
      <div className="card p-5 animate-fade-up">
        <AddTransactionScreen
          key={type}
          categories={snapshot.categories}
          goals={snapshot.goals}
          incomeSources={snapshot.incomeSources}
          defaultCurrency={summary.currency}
          today={summary.today}
          initialType={type}
          recentDescriptions={recent}
        />
      </div>
    </div>
  );
}
