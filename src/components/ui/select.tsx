import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn("brand-input h-[52px] w-full cursor-pointer rounded-md border border-[#542b2d] bg-[#0c0b0b] px-4 py-3 font-mono text-sm uppercase tracking-[0.06em] text-foreground outline-none hover:border-[#734044] focus:border-[#ff535b] focus:ring-2 focus:ring-[#ff535b]/15", className)}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
