"use client";

import Link from "next/link";
import { ChevronRight, LogOut, Settings } from "lucide-react";
import { useFinanceData } from "@/components/finance/finance-provider";
import { PageHeader } from "@/components/layout/page-header";
import { SECONDARY_NAV } from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

/** Groups the secondary screens so the "Plus" tab reads as a table of contents, not a flat list. */
const GROUPS: { title: string; hrefs: string[] }[] = [
  { title: "Mon argent", hrefs: ["/transactions", "/budgets", "/dettes", "/revenus", "/recurrents", "/categories"] },
  { title: "Vue d'ensemble", hrefs: ["/rapport", "/calendrier", "/notifications"] },
];

export function MoreView() {
  const { unreadNotifications, profile, email, summary: s, snapshot } = useFinanceData();
  const firstName = profile.display_name?.split(" ")[0] ?? "";
  const activeDebts = s.debts.filter((d) => d.state !== "settled").length;
  const activeRecurring = snapshot.recurring.filter((r) => r.is_active).length;

  const counters: Record<string, string | number | undefined> = {
    "/transactions": snapshot.transactions.length || undefined,
    "/budgets": s.budgets.length || undefined,
    "/dettes": activeDebts || undefined,
    "/recurrents": activeRecurring || undefined,
    "/categories": snapshot.categories.filter((c) => c.kind === "expense").length,
    "/revenus": s.salary.configured ? formatMoney(s.salary.amount, s.currency) : "à configurer",
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Plus" question="Tout MONY, au même endroit." action={<ThemeToggle />} />

      <Link href="/parametres" className="card p-4 flex items-center gap-3 press hover:bg-surface-2/60 transition-colors">
        <span className="h-12 w-12 rounded-2xl aurora text-ink-fg inline-flex items-center justify-center text-lg font-extrabold shrink-0">
          {(firstName || email || "M").charAt(0).toUpperCase()}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold truncate">{profile.display_name || "Mon profil"}</span>
          <span className="block text-xs text-fg-muted truncate">{email ?? ""}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-fg-muted">
          <Settings className="h-4 w-4" /> Paramètres
        </span>
        <ChevronRight className="h-4 w-4 text-fg-subtle" />
      </Link>

      {GROUPS.map((group) => (
        <section key={group.title}>
          <h2 className="px-1 mb-1.5 text-[12px] font-bold uppercase tracking-wider text-fg-subtle">{group.title}</h2>
          <nav className="card p-0 overflow-hidden divide-y divide-border">
            {group.hrefs.map((href) => {
              const item = SECONDARY_NAV.find((i) => i.href === href);
              if (!item) return null;
              const Icon = item.icon;
              const badge = href === "/notifications" ? unreadNotifications || undefined : counters[href];
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2/60 transition-colors press">
                  <span className="h-10 w-10 rounded-2xl bg-surface-2 inline-flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold">{item.label}</span>
                    {item.question ? <span className="block text-xs text-fg-muted">{item.question}</span> : null}
                  </span>
                  {badge !== undefined ? (
                    <span
                      className={
                        href === "/notifications"
                          ? "h-5 min-w-5 px-1.5 rounded-full bg-negative text-white text-[11px] font-bold inline-flex items-center justify-center"
                          : "text-xs font-semibold text-fg-muted tabular"
                      }
                    >
                      {badge}
                    </span>
                  ) : null}
                  <ChevronRight className="h-4 w-4 text-fg-subtle" />
                </Link>
              );
            })}
          </nav>
        </section>
      ))}

      <form action={signOut}>
        <Button type="submit" variant="ghost" full>
          <LogOut className="h-4 w-4" /> Se déconnecter
        </Button>
      </form>
    </div>
  );
}
