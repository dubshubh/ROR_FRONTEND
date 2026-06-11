import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full border border-[#5b403f] bg-[#2a2a2a] px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-[#8f7472] focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
