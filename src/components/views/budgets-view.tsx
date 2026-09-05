"use client";

import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { BudgetsScreen } from "@/components/budgets/budgets-screen";

export function BudgetsView() {
  const { summary: s, snapshot } = useFinanceData();
  return (
    <div>
      <PageHeader title="Budgets" question="Est-ce que je dépense trop ?" back="/plus" />
      <BudgetsScreen budgets={s.budgets} categories={snapshot.categories} currency={s.currency} totalSpent={s.month.expenses} monthLabel={s.month.label} />
    </div>
  );
}
