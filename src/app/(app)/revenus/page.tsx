import { IncomeView } from "@/components/views/income-view";

export const metadata = { title: "Revenus & salaire" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return <IncomeView />;
}
