import { getFinanceData } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { RecurringScreen } from "@/components/recurring/recurring-screen";

export const metadata = { title: "Dépenses récurrentes" };

export default async function RecurringPage() {
  const { summary: s, snapshot } = (await getFinanceData())!;
  return (
    <div>
      <PageHeader title="Dépenses récurrentes" question="Quelles sont mes charges fixes ?" back="/plus" />
      <RecurringScreen items={snapshot.recurring} categories={snapshot.categories} currency={s.currency} rates={s.rates} today={s.today} />
    </div>
  );
}
