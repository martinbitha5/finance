"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: string }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("inline-flex w-full p-1 rounded-2xl bg-surface-2 gap-1", className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all press",
              size === "sm" ? "h-8 text-xs px-2" : "h-10 text-sm px-3",
              active ? "bg-surface text-fg shadow-soft" : "text-fg-muted hover:text-fg",
            )}
          >
            {o.icon ? <span aria-hidden>{o.icon}</span> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className,
  color,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={active && color ? { backgroundColor: color, borderColor: color } : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-semibold border transition-all press whitespace-nowrap",
        active ? "bg-ink text-ink-fg border-ink dark:bg-fg dark:text-bg dark:border-fg" : "bg-surface border-border text-fg-muted hover:text-fg hover:border-border-strong",
        className,
      )}
    >
      {children}
    </button>
  );
}
