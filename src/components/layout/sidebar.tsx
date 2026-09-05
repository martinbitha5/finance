"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, SECONDARY_NAV } from "./nav-items";
import { APP_NAME } from "@/lib/constants";
import { signOut } from "@/actions/auth";
import { ThemeToggle } from "./theme-toggle";
import { LogoMark } from "@/components/brand/logo";
import { greeting } from "@/lib/format";

export function Sidebar({ name, unread }: { name: string; unread: number }) {
  const pathname = usePathname();
  const items = [...PRIMARY_NAV.filter((i) => i.href !== "/plus"), ...SECONDARY_NAV];
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[260px] flex-col border-r border-border bg-surface/60 backdrop-blur-xl px-4 py-6 z-40">
      <Link href="/" className="flex items-center gap-3 px-2 mb-8">
        <LogoMark size={40} className="rounded-2xl shadow-soft" />
        <span>
          <span className="block text-lg font-extrabold tracking-tight leading-none">{APP_NAME}</span>
          <span className="block text-[11px] text-fg-subtle mt-1">{greeting()}, {name}</span>
        </span>
      </Link>

      <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto no-scrollbar">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const isAdd = item.href === "/ajouter";
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 h-11 px-3 rounded-2xl text-[14px] font-semibold transition-colors press",
                isAdd
                  ? "my-2 bg-gradient-to-r from-accent to-accent-2 text-accent-fg shadow-soft"
                  : active
                    ? "bg-ink text-ink-fg dark:bg-fg dark:text-bg"
                    : "text-fg-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active || isAdd ? 2.4 : 2} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/notifications" && unread > 0 ? (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-negative text-white text-[11px] font-bold inline-flex items-center justify-center">{unread}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex items-center justify-between px-2">
        <ThemeToggle />
        <form action={signOut}>
          <button type="submit" className="inline-flex items-center gap-2 text-sm font-semibold text-fg-muted hover:text-fg press">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}
