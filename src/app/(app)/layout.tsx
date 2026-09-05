import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getFinanceData } from "@/services/finance-data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const data = await getFinanceData();
  if (!data) redirect("/login");
  if (!data.profile.onboarding_completed) redirect("/onboarding");
  const name = data.profile.display_name?.split(" ")[0] || "toi";
  return (
    <AppShell name={name} unread={data.unreadNotifications}>
      {children}
    </AppShell>
  );
}
