import { cn } from "@/lib/utils";
import { RiderStatus } from "@/types/rider";

export function StatusBadge({ status }: { status: RiderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
        status === "pending" && "border-amber-400 bg-amber-500/10 text-amber-300",
        status === "approved" && "border-emerald-400 bg-emerald-500/10 text-emerald-300",
        status === "rejected" && "border-[#d91b1b] bg-[#d91b1b]/10 text-[#ff696f]",
        status === "contact_again" && "border-sky-400 bg-sky-500/10 text-sky-300"
      )}
    >
      {status === "contact_again" ? "Contact again" : status}
    </span>
  );
}
