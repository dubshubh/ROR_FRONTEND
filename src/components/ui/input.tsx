import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "brand-input h-12 w-full border border-red-900 bg-[#1a1a1a] px-3 py-2 font-mono text-sm text-foreground outline-none file:border-0 file:bg-transparent file:font-mono file:text-xs file:text-[#d91b1b] placeholder:text-[#7d6b65] focus:border-red-600 focus:ring-1 focus:ring-red-600 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
