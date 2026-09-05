import { RecurringView } from "@/components/views/recurring-view";

export const metadata = { title: "Dépenses récurrentes" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return <RecurringView />;
}
