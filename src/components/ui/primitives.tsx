import * as React from "react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import type { Currency } from "@/lib/constants";

/* ---------- Progress bar ---------- */
export function Progress({
  value,
  color,
  className,
  size = "md",
}: {
  value: number;
  color?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full rounded-full bg-surface-2 overflow-hidden", size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: color ?? "var(--fg)" }}
      />
    </div>
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} aria-hidden />;
}

/* ---------- Empty state ---------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card flex flex-col items-center text-center px-6 py-10 gap-2 animate-pop", className)}>
      <div className="text-4xl mb-1">{icon}</div>
      <h3 className="font-bold">{title}</h3>
      {description ? <p className="text-sm text-fg-muted max-w-xs text-balance">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

/* ---------- Money display ---------- */
export function Money({
  amount,
  currency,
  className,
  colored,
  sign,
  compact,
}: {
  amount: number;
  currency: Currency;
  className?: string;
  colored?: boolean;
  sign?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "tabular font-semibold",
        colored && amount > 0 && "text-positive",
        colored && amount < 0 && "text-negative",
        className,
      )}
    >
      {formatMoney(amount, currency, { sign, compact })}
    </span>
  );
}

/* ---------- Icon bubble ---------- */
export function IconBubble({ icon, color, size = "md", className }: { icon: string; color?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const s = size === "sm" ? "h-9 w-9 text-base rounded-xl" : size === "lg" ? "h-14 w-14 text-2xl rounded-2xl" : "h-11 w-11 text-xl rounded-2xl";
  return (
    <div
      className={cn("inline-flex items-center justify-center shrink-0", s, className)}
      style={{ background: color ? `color-mix(in oklab, ${color} 18%, transparent)` : "var(--surface-2)" }}
      aria-hidden
    >
      {icon}
    </div>
  );
}

/* ---------- Badge ---------- */
export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "positive" | "negative" | "warning" | "info" | "accent"; children: React.ReactNode; className?: string }) {
  const tones = {
    neutral: "bg-surface-2 text-fg-muted",
    positive: "bg-positive/12 text-positive",
    negative: "bg-negative/12 text-negative",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/12 text-info",
    accent: "bg-accent/15 text-fg",
  };
  return <span className={cn("inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-bold uppercase tracking-wide", tones[tone], className)}>{children}</span>;
}

/* ---------- Toggle switch ---------- */
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-50",
        checked ? "bg-positive" : "bg-surface-3",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

/* ---------- Stat tile ---------- */
export function Stat({ label, value, tone, sub, className }: { label: string; value: React.ReactNode; tone?: "positive" | "negative" | "warning" | "neutral"; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-surface-2/70 p-3.5 min-w-0", className)}>
      <div className="text-[12px] font-semibold text-fg-muted truncate">{label}</div>
      <div
        className={cn(
          "text-lg font-extrabold tabular tracking-tight truncate mt-0.5",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </div>
      {sub ? <div className="text-[11px] text-fg-subtle truncate">{sub}</div> : null}
    </div>
  );
}

/* ---------- Row (list item) ---------- */
export function Row({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left",
        onClick && "hover:bg-surface-2/70 active:bg-surface-2 transition-colors",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
