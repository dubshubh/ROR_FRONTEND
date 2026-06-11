import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full border border-[#5b403f] bg-[#2a2a2a] px-3 py-2 font-mono text-sm text-foreground outline-none file:border-0 file:bg-transparent file:font-mono file:text-xs file:text-[#ffb3b1] placeholder:text-[#8f7472] focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
