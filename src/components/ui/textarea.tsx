import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "brand-input min-h-28 w-full resize-y rounded-md border border-[#542b2d] bg-[#0c0b0b] px-4 py-3 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-[#705f59] hover:border-[#734044] focus:border-[#ff535b] focus:ring-2 focus:ring-[#ff535b]/15 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
