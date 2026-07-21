import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-background p-4"><div className="text-center"><p className="font-mono text-sm uppercase tracking-[0.25em] text-primary">404 · Route not found</p><h1 className="mt-3 font-display text-5xl text-foreground">Wrong turn</h1><p className="mt-3 text-muted-foreground">The road you requested does not exist.</p><Button asChild className="mt-6"><Link href="/">Return home</Link></Button></div></main>;
}
