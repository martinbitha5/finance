"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-safe"
      aria-label="Navigation principale"
    >
      <div className="mx-auto max-w-lg px-3 pb-2">
        <div className="relative flex items-end justify-between rounded-3xl border border-border bg-surface/90 backdrop-blur-xl shadow-float px-2 h-[68px]">
          {PRIMARY_NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            if (item.href === "/ajouter") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className="relative -top-5 flex flex-col items-center flex-1"
                >
                  <span
                    className={cn(
                      "h-14 w-14 rounded-full inline-flex items-center justify-center shadow-float press transition-transform",
                      "bg-gradient-to-br from-accent to-accent-2 text-accent-fg ring-4 ring-bg",
                      active && "scale-105",
                    )}
                  >
                    <Icon className="h-7 w-7" strokeWidth={2.5} />
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 h-full text-[11px] font-semibold transition-colors press",
                  active ? "text-fg" : "text-fg-subtle hover:text-fg-muted",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className={cn("relative inline-flex h-7 w-7 items-center justify-center rounded-xl transition-all", active && "bg-surface-2")}>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
