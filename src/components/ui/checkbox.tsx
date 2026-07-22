"use client";

import { Check } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Checkbox=forwardRef<HTMLInputElement,React.InputHTMLAttributes<HTMLInputElement>>(({className,...props},ref)=><label className={cn("ui-checkbox",className)}><input ref={ref} type="checkbox" {...props}/><span aria-hidden="true"><Check/></span></label>);
Checkbox.displayName="Checkbox";
