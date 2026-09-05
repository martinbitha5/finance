import { getFinanceData } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsScreen } from "@/components/settings/settings-screen";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const { settings, profile, snapshot, email } = (await getFinanceData())!;
  return (
    <div>
      <PageHeader title="Paramètres" back="/plus" />
      <SettingsScreen settings={settings} profile={profile} categories={snapshot.categories} email={email ?? ""} />
    </div>
  );
}
