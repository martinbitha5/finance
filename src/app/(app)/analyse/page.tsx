import { AnalyseView } from "@/components/views/analyse-view";

export const metadata = { title: "Analyse" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return <AnalyseView />;
}
