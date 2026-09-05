import { ReportView } from "@/components/views/report-view";

export const metadata = { title: "Rapport du mois" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return <ReportView />;
}
