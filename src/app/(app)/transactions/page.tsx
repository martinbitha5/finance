import { Suspense } from "react";
import { TransactionsView } from "@/components/views/transactions-view";
import { AppSkeleton } from "@/components/layout/app-skeleton";

export const metadata = { title: "Transactions" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <TransactionsView />
    </Suspense>
  );
}
