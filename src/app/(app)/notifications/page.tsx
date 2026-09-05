import { NotificationsView } from "@/components/views/notifications-view";

export const metadata = { title: "Notifications" };

// Static page: the data comes from the on-device finance store, not from the server.
export default function Page() {
  return <NotificationsView />;
}
