"use client";

import { cn } from "@/lib/utils";
import { SiteLogo } from "@/types/settings";

export function SiteBrand({ logo, compact = false }: { logo?: SiteLogo; compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className={cn("brand-emblem shrink-0 overflow-hidden", compact ? "h-9 w-9 sm:h-11 sm:w-11" : "h-14 w-14 sm:h-16 sm:w-16")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo?.url || "/images/rebels-on-roads-3d.png"}
          alt="Riding group logo"
          className="h-full w-full object-cover object-right"
        />
      </div>
      <div className="min-w-0">
        <div className={cn("brand-title truncate font-display leading-none", compact ? "text-lg sm:text-2xl" : "text-2xl sm:text-3xl")}>Rebels On Roads</div>
        <div className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:block">Registration & Management</div>
      </div>
    </div>
  );
}
