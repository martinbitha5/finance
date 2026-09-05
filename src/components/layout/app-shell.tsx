import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children, name, unread }: { children: React.ReactNode; name: string; unread: number }) {
  return (
    <div className="min-h-dvh">
      <Sidebar name={name} unread={unread} />
      <main className="lg:pl-[260px]">
        <div className="mx-auto w-full max-w-lg lg:max-w-5xl px-4 sm:px-6 lg:px-10 pt-safe pb-[110px] lg:pb-12">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
