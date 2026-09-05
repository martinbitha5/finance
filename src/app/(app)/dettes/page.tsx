import { DebtsView } from "@/components/views/debts-view";

export const metadata = { title: "Dettes" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return <DebtsView />;
}
