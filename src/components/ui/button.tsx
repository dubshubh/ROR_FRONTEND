import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "outline" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
};

export function Button({ className, variant = "default", size = "default", asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "brand-button rebel-hover inline-flex items-center justify-center gap-2 border font-mono text-xs font-bold uppercase tracking-[0.12em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "border-red-600 bg-red-600 text-white shadow-[0_0_24px_rgba(217,27,27,0.28)] hover:border-red-700 hover:bg-red-700",
        variant === "outline" && "border-[#d91b1b] bg-transparent text-[#e8d9c9] hover:border-[#e8d9c9] hover:bg-red-950/30",
        variant === "secondary" && "border-[#2b2223] bg-[#1a1a1a] text-[#e8d9c9] hover:border-[#d91b1b]",
        variant === "destructive" && "border-red-600 bg-transparent text-red-600 hover:bg-red-950/20",
        size === "default" && "h-12 px-6 py-2",
        size === "sm" && "h-10 px-4",
        size === "lg" && "h-14 px-7 py-3 text-sm",
        size === "icon" && "h-10 w-10",
        className
      )}
      {...props}
    />
  );
}
