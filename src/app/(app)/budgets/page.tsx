import { BudgetsView } from "@/components/views/budgets-view";

export const metadata = { title: "Budgets" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return <BudgetsView />;
}
