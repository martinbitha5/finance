"use client";

import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { DebtsScreen } from "@/components/debts/debts-screen";

export function DebtsView() {
  const { summary: s, snapshot } = useFinanceData();
  return (
    <div>
      <PageHeader title="Mes dettes" question="Qu'est-ce que je dois, et à qui ?" back="/plus" />
      <DebtsScreen
        debts={s.debts}
        transactions={snapshot.transactions}
        currency={s.currency}
        today={s.today}
        totalOwed={s.totalOwed}
        totalLent={s.totalLent}
        remainingThisCycle={s.remainingDebtPayments}
      />
    </div>
  );
}
