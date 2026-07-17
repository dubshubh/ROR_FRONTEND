"use client";

import { cn } from "@/lib/utils";
import { SiteLogo } from "@/types/settings";

export function SiteBrand({ logo, compact = false }: { logo?: SiteLogo; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("brand-emblem shrink-0 overflow-hidden", compact ? "h-11 w-11" : "h-16 w-16")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo?.url || "/images/rebels-on-roads-3d.png"}
          alt="Riding group logo"
          className="h-full w-full object-cover object-right"
        />
      </div>
      <div>
        <div className={cn("brand-title font-display leading-none", compact ? "text-2xl" : "text-3xl")}>Rebels On Roads</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Registration & Management</div>
      </div>
    </div>
  );
}
