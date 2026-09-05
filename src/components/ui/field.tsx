"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? <span className="block text-[13px] font-semibold text-fg-muted mb-1.5 px-1">{label}</span> : null}
      {children}
      {error ? (
        <span className="block text-xs text-negative mt-1.5 px-1">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-fg-subtle mt-1.5 px-1">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputClass =
  "w-full h-12 px-4 rounded-2xl bg-surface-2 border border-transparent text-[15px] placeholder:text-fg-subtle " +
  "transition-all focus:outline-none focus:bg-surface focus:border-border-strong focus:ring-4 focus:ring-accent/25 " +
  "aria-[invalid=true]:border-negative/60";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "h-auto min-h-24 py-3 resize-none", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(inputClass, "appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle" />
    </div>
  );
}

/** Big money input used on the "Ajouter" screen. */
export function AmountInput({
  value,
  onChange,
  symbol,
  autoFocus,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  symbol: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-center gap-2 tabular", className)}>
      <input
        inputMode="decimal"
        autoFocus={autoFocus}
        placeholder="0"
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
          if ((v.match(/\./g) ?? []).length > 1) return;
          if (/^\d*\.?\d{0,2}$/.test(v)) onChange(v);
        }}
        className="w-auto max-w-[70vw] min-w-[3ch] bg-transparent text-center text-6xl font-extrabold tracking-tight outline-none placeholder:text-fg-subtle/50"
        style={{ width: `${Math.max(1, value.length || 1)}ch` }}
        aria-label="Montant"
      />
      <span className="text-2xl font-bold text-fg-muted">{symbol}</span>
    </div>
  );
}
