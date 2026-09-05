"use client";

import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { IncomeScreen } from "@/components/income/income-screen";

export function IncomeView() {
  const { summary: s, snapshot } = useFinanceData();
  return (
    <div>
      <PageHeader title="Revenus & salaire" question="Combien je gagne, et quand ?" back="/plus" />
      <IncomeScreen s={s} sources={snapshot.incomeSources} />
    </div>
  );
}
