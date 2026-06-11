import { cn } from "@/lib/utils";
import { RiderStatus } from "@/types/rider";

export function StatusBadge({ status }: { status: RiderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
        status === "pending" && "border-amber-400 bg-amber-500/10 text-amber-300",
        status === "approved" && "border-emerald-400 bg-emerald-500/10 text-emerald-300",
        status === "rejected" && "border-[#ff535b] bg-[#ff535b]/10 text-[#ffb3b1]"
      )}
    >
      {status}
    </span>
  );
}
