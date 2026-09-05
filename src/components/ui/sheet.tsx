"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Bottom sheet on mobile, centered dialog on desktop. Closes on backdrop tap / Escape.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  const mounted = useMounted();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          "relative w-full sm:w-[min(92vw,520px)] max-h-[92dvh] overflow-y-auto no-scrollbar",
          "bg-surface rounded-t-4xl sm:rounded-4xl shadow-float border border-border animate-sheet-up",
          wide && "sm:w-[min(92vw,720px)]",
          className,
        )}
      >
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur px-5 pt-3 pb-2 flex items-center gap-3 border-b border-border sm:pt-5">
          <div className="sm:hidden absolute left-1/2 -translate-x-1/2 top-2 h-1.5 w-10 rounded-full bg-surface-3" />
          <h2 className="flex-1 text-lg font-bold tracking-tight mt-3 sm:mt-0">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="mt-3 sm:mt-0 h-9 w-9 rounded-full bg-surface-2 hover:bg-surface-3 inline-flex items-center justify-center text-fg-muted press"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 pb-safe">{children}</div>
        <div className="h-4 sm:h-0" />
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Supprimer",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {description ? <p className="text-fg-muted mb-5">{description}</p> : null}
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 h-12 rounded-2xl bg-surface-2 font-semibold press">
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 h-12 rounded-2xl bg-negative text-white font-semibold press disabled:opacity-60"
        >
          {loading ? "…" : confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
