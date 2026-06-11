import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn("h-12 w-full border border-[#5b403f] bg-[#2a2a2a] px-3 py-2 font-mono text-sm uppercase tracking-[0.06em] text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary", className)}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
