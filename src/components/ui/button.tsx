"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "accent";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-ink-fg hover:bg-ink-2 dark:bg-fg dark:text-bg dark:hover:opacity-90 shadow-soft",
  accent: "bg-gradient-to-r from-accent to-accent-2 text-accent-fg font-bold shadow-soft hover:brightness-105",
  secondary: "bg-surface-2 text-fg hover:bg-surface-3",
  outline: "border border-border-strong bg-transparent text-fg hover:bg-surface-2",
  ghost: "bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-negative/10 text-negative hover:bg-negative/15",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-[15px] rounded-2xl gap-2",
  lg: "h-13 px-6 text-base rounded-2xl gap-2",
  icon: "h-10 w-10 rounded-xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  href?: string;
  full?: boolean;
}

export function Button({ className, variant = "primary", size = "md", loading, href, full, children, disabled, ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center font-semibold select-none whitespace-nowrap press",
    "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40",
    "disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    full && "w-full",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
