import { getFinanceData } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { GoalsScreen } from "@/components/goals/goals-screen";

export const metadata = { title: "Objectifs" };

export default async function GoalsPage() {
  const { summary: s } = (await getFinanceData())!;
  return (
    <div>
      <PageHeader title="Mes objectifs" question="Est-ce que je progresse ?" />
      <GoalsScreen goals={s.goals} currency={s.currency} today={s.today} totalSaved={s.totalSavedInGoals} plannedMonthly={s.plannedSavings} savedThisMonth={s.month.savings} />
    </div>
  );
}
