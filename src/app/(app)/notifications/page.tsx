import { getNotifications } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationsScreen } from "@/components/notifications/notifications-screen";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const items = await getNotifications();
  return (
    <div>
      <PageHeader title="Notifications" back="/" />
      <NotificationsScreen items={items} />
    </div>
  );
}
