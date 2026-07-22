"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "./button";
import { Dialog } from "./dialog";

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", onConfirm, pending = false, destructive = true }: { open:boolean; onOpenChange:(open:boolean)=>void; title:string; description:string; confirmLabel?:string; onConfirm:()=>void; pending?:boolean; destructive?:boolean }) {
  return <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description}><div className="ui-confirm-symbol"><AlertTriangle/></div><p className="ui-confirm-note">{destructive ? "This action cannot be undone." : "Please review the details before continuing."}</p><div className="ui-dialog-actions"><Button variant="secondary" onClick={()=>onOpenChange(false)} disabled={pending}>Cancel</Button><Button variant={destructive?"destructive":"default"} onClick={onConfirm} disabled={pending}>{destructive?<Trash2 className="h-4 w-4"/>:null}{pending?"Working...":confirmLabel}</Button></div></Dialog>;
}
