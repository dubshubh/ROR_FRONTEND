"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Page rendering failed", error.digest ?? error.name); }, [error]);
  return <main className="flex min-h-screen items-center justify-center bg-background p-4"><div className="rebel-frame max-w-lg bg-card p-8 text-center"><h1 className="font-display text-4xl text-foreground">Roadblock</h1><p className="mt-3 text-muted-foreground">This page could not be loaded. Your data was not submitted again.</p><Button className="mt-6" onClick={reset}>Try again</Button></div></main>;
}
