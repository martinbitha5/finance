import { Plus } from "lucide-react";
import { getFinanceData } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionsList } from "@/components/transactions/transactions-list";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Transactions" };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ categorie?: string }> }) {
  const { snapshot, summary } = (await getFinanceData())!;
  const sp = await searchParams;
  return (
    <div>
      <PageHeader
        title="Transactions"
        question="Qu'est-ce que j'ai dépensé ?"
        action={
          <Button href="/ajouter" size="icon" aria-label="Ajouter">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />
      <TransactionsList
        transactions={snapshot.transactions}
        categories={snapshot.categories}
        goals={snapshot.goals}
        incomeSources={snapshot.incomeSources}
        currency={summary.currency}
        rates={summary.rates}
        today={summary.today}
        initialCategory={sp.categorie}
      />
    </div>
  );
}
