import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "brand-input min-h-28 w-full border border-red-900 bg-[#1a1a1a] px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-[#7d6b65] focus:border-red-600 focus:ring-1 focus:ring-red-600 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
