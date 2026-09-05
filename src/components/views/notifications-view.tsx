"use client";

import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationsScreen } from "@/components/notifications/notifications-screen";

export function NotificationsView() {
  const { notifications } = useFinanceData();
  return (
    <div>
      <PageHeader title="Notifications" back="/" />
      <NotificationsScreen items={notifications} />
    </div>
  );
}
