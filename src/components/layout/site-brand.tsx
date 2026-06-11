"use client";

import { Bike } from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteLogo } from "@/types/settings";

export function SiteBrand({ logo, compact = false }: { logo?: SiteLogo; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {logo?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.url}
          alt="Riding group logo"
        className={cn("border border-primary bg-white object-contain", compact ? "h-10 w-10" : "h-14 w-14")}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center border border-primary bg-primary text-primary-foreground",
            compact ? "h-10 w-10" : "h-14 w-14"
          )}
        >
          <Bike className={compact ? "h-5 w-5" : "h-6 w-6"} />
        </div>
      )}
      <div>
        <div className={cn("font-display leading-none text-[#ffb3b1]", compact ? "text-2xl" : "text-3xl")}>Rebels On Roads</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Registration & Management</div>
      </div>
    </div>
  );
}
