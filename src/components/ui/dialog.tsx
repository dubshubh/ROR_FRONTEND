"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";

export function Dialog({ open, onOpenChange, title, description, children, maxWidth = "max-w-lg" }: { open:boolean; onOpenChange:(open:boolean)=>void; title:string; description?:string; children:React.ReactNode; maxWidth?:string }) {
  useEffect(()=>{if(!open)return;const close=(event:KeyboardEvent)=>event.key==="Escape"&&onOpenChange(false);document.addEventListener("keydown",close);const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.removeEventListener("keydown",close);document.body.style.overflow=previous}},[open,onOpenChange]);
  if(!open||typeof document==="undefined")return null;
  return createPortal(<div className="ui-dialog-backdrop" role="presentation" onMouseDown={(event)=>event.target===event.currentTarget&&onOpenChange(false)}><section role="dialog" aria-modal="true" aria-labelledby="shared-dialog-title" className={`ui-dialog-panel ${maxWidth}`}><div className="ui-dialog-accent"/><header><div><p>Rebels on Roads · Admin</p><h2 id="shared-dialog-title">{title}</h2>{description?<span>{description}</span>:null}</div><Button size="icon" variant="outline" aria-label="Close dialog" onClick={()=>onOpenChange(false)}><X className="h-4 w-4"/></Button></header><div className="ui-dialog-content">{children}</div></section></div>,document.body);
}
