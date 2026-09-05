"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const options = [
    { v: "light", icon: Sun, label: "Clair" },
    { v: "dark", icon: Moon, label: "Sombre" },
    { v: "system", icon: Monitor, label: "Auto" },
  ] as const;
  return (
    <div className={cn("inline-flex p-1 rounded-full bg-surface-2 gap-0.5", className)} role="radiogroup" aria-label="Thème">
      {options.map((o) => {
        const active = mounted && theme === o.v;
        const Icon = o.icon;
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            onClick={() => setTheme(o.v)}
            className={cn("h-8 w-8 rounded-full inline-flex items-center justify-center transition-all press", active ? "bg-surface shadow-soft text-fg" : "text-fg-subtle hover:text-fg")}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
