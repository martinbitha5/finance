import { getFinanceData } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { DebtsScreen } from "@/components/debts/debts-screen";

export const metadata = { title: "Dettes" };

export default async function DebtsPage() {
  const { summary: s, snapshot } = (await getFinanceData())!;
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
