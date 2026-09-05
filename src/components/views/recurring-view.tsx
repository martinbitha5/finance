"use client";

import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { RecurringScreen } from "@/components/recurring/recurring-screen";

export function RecurringView() {
  const { summary: s, snapshot } = useFinanceData();
  return (
    <div>
      <PageHeader title="Dépenses récurrentes" question="Quelles sont mes charges fixes ?" back="/plus" />
      <RecurringScreen items={snapshot.recurring} categories={snapshot.categories} currency={s.currency} rates={s.rates} today={s.today} />
    </div>
  );
}
