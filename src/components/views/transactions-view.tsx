"use client";

import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionsList } from "@/components/transactions/transactions-list";
import { Button } from "@/components/ui/button";

export function TransactionsView() {
  const { snapshot, summary } = useFinanceData();
  const sp = useSearchParams();
  const initialCategory = sp.get("categorie") ?? undefined;
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
        key={initialCategory ?? "all"}
        transactions={snapshot.transactions}
        categories={snapshot.categories}
        goals={snapshot.goals}
        incomeSources={snapshot.incomeSources}
        currency={summary.currency}
        rates={summary.rates}
        today={summary.today}
        initialCategory={initialCategory}
      />
    </div>
  );
}
