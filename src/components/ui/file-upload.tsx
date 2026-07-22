"use client";
/* eslint-disable @next/next/no-img-element -- blob URLs are local previews and cannot use the image optimizer */

import { CheckCircle2, FileText, FileUp } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const FileUpload = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, onChange, accept = ".jpg,.jpeg,.png,.pdf", ...props }, ref) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) { setPreview(undefined); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <div className={cn("shared-file-upload", file && "has-file", className)}>
    <div className="shared-file-visual">{preview ? <img src={preview} alt="Selected document preview"/> : file?.type === "application/pdf" ? <FileText/> : <FileUp/>}</div>
    <div className="shared-file-copy">{file ? <><strong>{file.name}</strong><span>{formatBytes(file.size)} · {file.type === "application/pdf" ? "PDF document" : "Image ready"}</span></> : <><strong>Choose file</strong><span>JPG, PNG or PDF</span></>}</div>
    {file ? <span className="shared-file-ready"><CheckCircle2/>Selected</span> : <span className="shared-file-browse">Browse</span>}
    <input ref={ref} type="file" accept={accept} onChange={(event) => { setFile(event.target.files?.[0] ?? null); onChange?.(event); }} {...props}/>
  </div>;
});
FileUpload.displayName = "FileUpload";

function formatBytes(bytes:number){if(bytes<1024)return `${bytes} B`;if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;return `${(bytes/(1024*1024)).toFixed(1)} MB`}
