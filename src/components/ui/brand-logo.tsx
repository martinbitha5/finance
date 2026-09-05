"use client";

import * as React from "react";
import { brandLogoUrl } from "@/lib/finance/brands";
import { cn } from "@/lib/utils";

/** Logo officiel d'une marque (favicon du domaine), avec repli sur l'emoji si l'image ne charge pas. */
export function BrandLogo({ domain, fallback, className }: { domain: string; fallback: React.ReactNode; className?: string }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandLogoUrl(domain)}
      alt=""
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("object-contain select-none", className)}
    />
  );
}
