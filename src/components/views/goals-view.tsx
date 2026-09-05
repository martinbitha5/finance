"use client";

import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { GoalsScreen } from "@/components/goals/goals-screen";

export function GoalsView() {
  const { summary: s } = useFinanceData();
  return (
    <div>
      <PageHeader title="Mes objectifs" question="Est-ce que je progresse ?" />
      <GoalsScreen goals={s.goals} currency={s.currency} today={s.today} totalSaved={s.totalSavedInGoals} plannedMonthly={s.plannedSavings} savedThisMonth={s.month.savings} />
    </div>
  );
}
