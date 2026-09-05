import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, action }: { className?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 mb-3", className)}>
      <h2 className="text-[15px] font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

export function SectionTitle({ children, hint, action }: { children: React.ReactNode; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1 mb-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight">{children}</h2>
        {hint ? <p className="text-sm text-fg-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}
