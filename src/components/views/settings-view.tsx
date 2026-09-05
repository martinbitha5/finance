"use client";

import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsScreen } from "@/components/settings/settings-screen";

export function SettingsView() {
  const { settings, profile, snapshot, email } = useFinanceData();
  return (
    <div>
      <PageHeader title="Paramètres" back="/plus" />
      <SettingsScreen
        settings={settings}
        profile={profile}
        categories={snapshot.categories}
        transactions={snapshot.transactions}
        goals={snapshot.goals}
        debts={snapshot.debts}
        email={email ?? ""}
      />
    </div>
  );
}
