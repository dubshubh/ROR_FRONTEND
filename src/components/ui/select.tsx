import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn("brand-input h-12 w-full border border-red-900 bg-[#1a1a1a] px-3 py-2 font-mono text-sm uppercase tracking-[0.06em] text-foreground outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600", className)}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
