import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { RiderFile } from "@/types/rider";

export function DocumentPreview({ label, file }: { label: string; file: RiderFile }) {
  const isPdf = file.url.toLowerCase().includes(".pdf");
  return (
    <Link href={file.url} target="_blank" className="rebel-frame rebel-hover block bg-card p-3">
      <div className="mb-2 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#ffb3b1]">
        <span>{label}</span>
        <ExternalLink className="h-4 w-4" />
      </div>
      {isPdf ? (
        <div className="flex h-40 items-center justify-center bg-muted">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.url} alt={label} className="h-40 w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
      )}
    </Link>
  );
}
