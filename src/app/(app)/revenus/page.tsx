import { getFinanceData } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { IncomeScreen } from "@/components/income/income-screen";

export const metadata = { title: "Revenus & salaire" };

export default async function IncomePage() {
  const { summary: s, snapshot } = (await getFinanceData())!;
  return (
    <div>
      <PageHeader title="Revenus & salaire" question="Combien je gagne, et quand ?" back="/plus" />
      <IncomeScreen s={s} sources={snapshot.incomeSources} />
    </div>
  );
}
