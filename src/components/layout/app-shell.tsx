import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

/**
 * Responsive shell:
 * - < 768px  : single column, bottom navigation
 * - 768-1023 : wider column (tablet), bottom navigation, pages may use 2-column grids
 * - ≥ 1024px : fixed sidebar, content area up to 1100px
 */
export function AppShell({ children, name, unread }: { children: React.ReactNode; name: string; unread: number }) {
  return (
    <div className="min-h-dvh">
      <Sidebar name={name} unread={unread} />
      <main className="lg:pl-[260px]">
        <div className="mx-auto w-full max-w-lg md:max-w-3xl lg:max-w-[1100px] px-4 sm:px-6 md:px-8 lg:px-10 pt-safe pb-[110px] lg:pb-12">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
