import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "outline" | "destructive" | "secondary";
  size?: "default" | "sm" | "icon";
};

export function Button({ className, variant = "default", size = "default", asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "rebel-hover inline-flex items-center justify-center gap-2 border font-mono text-xs font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "border-primary bg-primary text-primary-foreground shadow-[0_0_22px_rgba(255,83,91,0.18)] hover:bg-[#ff6b72]",
        variant === "outline" && "border-[#ffb3b1] bg-transparent text-[#ffdad8] hover:bg-[#2a1517]",
        variant === "secondary" && "border-[#5b403f] bg-muted text-foreground hover:border-primary",
        variant === "destructive" && "border-destructive bg-transparent text-destructive hover:bg-[#2a1517]",
        size === "default" && "h-12 px-5 py-2",
        size === "sm" && "h-10 px-4",
        size === "icon" && "h-10 w-10",
        className
      )}
      {...props}
    />
  );
}
