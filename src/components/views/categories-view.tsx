"use client";

import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { CategoriesManager } from "@/components/categories/categories-manager";

export function CategoriesView() {
  const { snapshot } = useFinanceData();
  return (
    <div>
      <PageHeader title="Catégories" question="Comment je classe mes dépenses ?" back="/plus" />
      <CategoriesManager categories={snapshot.categories} transactions={snapshot.transactions} />
    </div>
  );
}
