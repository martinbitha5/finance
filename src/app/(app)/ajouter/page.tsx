import { getFinanceData } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { AddTransactionScreen } from "@/components/transactions/add-transaction-screen";
import type { TransactionType } from "@/lib/constants";

export const metadata = { title: "Ajouter" };

export default async function AddPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const data = (await getFinanceData())!;
  const { snapshot, summary } = data;
  const sp = await searchParams;
  const type = (["expense", "income", "saving"].includes(sp.type ?? "") ? sp.type : "expense") as TransactionType;

  const recent = Array.from(
    new Set(
      snapshot.transactions
        .filter((t) => t.type === "expense" && t.description && !t.recurring_expense_id)
        .map((t) => t.description),
    ),
  ).slice(0, 8);

  return (
    <div>
      <PageHeader title="Ajouter" question="En quelques secondes." />
      <div className="card p-5 animate-fade-up">
        <AddTransactionScreen
          categories={snapshot.categories}
          goals={snapshot.goals}
          incomeSources={snapshot.incomeSources}
          defaultCurrency={summary.currency}
          today={summary.today}
          initialType={type}
          recentDescriptions={recent}
        />
      </div>
    </div>
  );
}
