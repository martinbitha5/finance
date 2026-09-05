"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  question,
  back,
  action,
  unread,
  className,
}: {
  title: string;
  question?: string;
  back?: boolean | string;
  action?: React.ReactNode;
  unread?: number;
  className?: string;
}) {
  const router = useRouter();
  return (
    <header className={cn("flex items-center gap-3 pt-5 pb-4 lg:pt-8", className)}>
      {back ? (
        typeof back === "string" ? (
          <Link href={back} aria-label="Retour" className="h-10 w-10 rounded-full bg-surface border border-border inline-flex items-center justify-center press shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        ) : (
          <button type="button" onClick={() => router.back()} aria-label="Retour" className="h-10 w-10 rounded-full bg-surface border border-border inline-flex items-center justify-center press shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )
      ) : null}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight leading-tight truncate">{title}</h1>
        {question ? <p className="text-sm text-fg-muted">{question}</p> : null}
      </div>
      {action}
      {unread !== undefined ? (
        <Link href="/notifications" aria-label="Notifications" className="relative h-10 w-10 rounded-full bg-surface border border-border inline-flex items-center justify-center press lg:hidden">
          <Bell className="h-5 w-5" />
          {unread > 0 ? <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-negative text-white text-[10px] font-bold inline-flex items-center justify-center">{unread}</span> : null}
        </Link>
      ) : null}
    </header>
  );
}
