import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "brand-input h-[52px] w-full rounded-md border border-[#542b2d] bg-[#0c0b0b] px-4 py-3 font-mono text-sm text-foreground outline-none file:border-0 file:bg-transparent file:font-mono file:text-xs file:text-[#ff535b] placeholder:text-[#705f59] hover:border-[#734044] focus:border-[#ff535b] focus:ring-2 focus:ring-[#ff535b]/15 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
