import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getFinanceData } from "@/services/finance-data";
import { PageHeader } from "@/components/layout/page-header";
import { SECONDARY_NAV } from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { DemoButton } from "@/components/settings/demo-button";

export const metadata = { title: "Plus" };

export default async function MorePage() {
  const { unreadNotifications, settings, profile } = (await getFinanceData())!;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Plus" question={`Tout ${profile.display_name ? `pour ${profile.display_name.split(" ")[0]}` : "MONY"}, au même endroit.`} action={<ThemeToggle />} />
      <nav className="card p-0 overflow-hidden divide-y divide-border">
        {SECONDARY_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2/60 transition-colors press">
              <span className="h-10 w-10 rounded-2xl bg-surface-2 inline-flex items-center justify-center"><Icon className="h-5 w-5" /></span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold">{item.label}</span>
                {item.question ? <span className="block text-xs text-fg-muted">{item.question}</span> : null}
              </span>
              {item.href === "/notifications" && unreadNotifications > 0 ? <span className="h-5 min-w-5 px-1.5 rounded-full bg-negative text-white text-[11px] font-bold inline-flex items-center justify-center">{unreadNotifications}</span> : null}
              <ChevronRight className="h-4 w-4 text-fg-subtle" />
            </Link>
          );
        })}
      </nav>
      <DemoButton loaded={settings.demo_loaded} full />
      <form action={signOut}>
        <Button type="submit" variant="ghost" full>Se déconnecter</Button>
      </form>
    </div>
  );
}
