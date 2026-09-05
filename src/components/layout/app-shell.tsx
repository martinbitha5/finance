"use client";

import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";
import { useFinance } from "@/components/finance/finance-provider";
import { FinanceGate } from "@/components/finance/finance-gate";

/**
 * Responsive shell:
 * - < 768px  : single column, bottom navigation
 * - 768-1023 : wider column (tablet), bottom navigation, pages may use 2-column grids
 * - ≥ 1024px : fixed sidebar, content area up to 1100px
 *
 * Navigation chrome renders immediately; the page content waits for the finance store.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { data } = useFinance();
  const name = data?.profile.display_name?.split(" ")[0] || "toi";
  return (
    <div className="min-h-dvh">
      <Sidebar name={name} unread={data?.unreadNotifications ?? 0} />
      <main className="lg:pl-[260px]">
        <div className="mx-auto w-full max-w-lg md:max-w-3xl lg:max-w-[1100px] px-4 sm:px-6 md:px-8 lg:px-10 pt-safe pb-[110px] lg:pb-12">
          <FinanceGate>{children}</FinanceGate>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
