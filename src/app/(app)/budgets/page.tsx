import { getFinanceData } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { BudgetsScreen } from "@/components/budgets/budgets-screen";

export const metadata = { title: "Budgets" };

export default async function BudgetsPage() {
  const { summary: s, snapshot } = (await getFinanceData())!;
  return (
    <div>
      <PageHeader title="Budgets" question="Est-ce que je dépense trop ?" back="/plus" />
      <BudgetsScreen budgets={s.budgets} categories={snapshot.categories} currency={s.currency} totalSpent={s.month.expenses} monthLabel={s.month.label} />
    </div>
  );
}
