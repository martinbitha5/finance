"use client";

import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { FinancialCalendar } from "@/components/calendar/financial-calendar";

export function CalendarView() {
  const { summary: s, snapshot } = useFinanceData();
  return (
    <div>
      <PageHeader title="Calendrier" question="Qu'est-ce qui arrive, et quand ?" back="/plus" />
      <FinancialCalendar
        transactions={snapshot.transactions}
        recurring={snapshot.recurring}
        incomeSources={snapshot.incomeSources}
        goals={snapshot.goals}
        debts={snapshot.debts}
        categories={snapshot.categories}
        currency={s.currency}
        rates={s.rates}
        today={s.today}
      />
    </div>
  );
}
