import { Suspense } from "react";
import { AddView } from "@/components/views/add-view";
import { AppSkeleton } from "@/components/layout/app-skeleton";

export const metadata = { title: "Ajouter" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <AddView />
    </Suspense>
  );
}
