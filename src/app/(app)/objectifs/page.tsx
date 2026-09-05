import { GoalsView } from "@/components/views/goals-view";

export const metadata = { title: "Objectifs" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return <GoalsView />;
}
