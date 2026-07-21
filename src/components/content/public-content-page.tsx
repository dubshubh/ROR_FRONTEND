import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Camera, MapPin, Play, Route } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import type { ContentItem } from "@/types/content";

type PageMode = "event" | "route" | "brand" | "gallery";

export function PublicContentPage({ eyebrow, title, description, items, mode }: { eyebrow: string; title: string; description: string; items: ContentItem[]; mode: PageMode }) {
  return <main className="min-h-screen bg-background"><PublicHeader />
    <section className="relative overflow-hidden border-b-2 border-red-600 bg-[#080808]"><div className="checkered-strip absolute inset-x-0 top-0 h-2 opacity-70" /><div className="mx-auto max-w-6xl px-4 py-14 sm:py-20"><p className="font-mono text-xs uppercase tracking-[0.25em] text-[#ff535b]">{eyebrow}</p><h1 className="mt-3 max-w-4xl font-display text-4xl text-[#e8d9c9] sm:text-6xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p></div></section>
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      {!items.length ? <EmptyState /> : mode === "gallery" ? <Gallery items={items} /> : mode === "brand" ? <Brands items={items} /> : <Timeline items={items} mode={mode} />}
    </section>
    <CallToAction /><SiteFooter />
  </main>;
}

function Timeline({ items, mode }: { items: ContentItem[]; mode: "event" | "route" }) {
  const active = items.filter((item) => item.status !== "completed");
  const completed = items.filter((item) => item.status === "completed");
  return <div className="space-y-14"><ContentGroup title="Upcoming / Ongoing" items={active} mode={mode} /><ContentGroup title="Completed" items={completed} mode={mode} /></div>;
}

function ContentGroup({ title, items, mode }: { title: string; items: ContentItem[]; mode: "event" | "route" }) {
  if (!items.length) return null;
  return <section><div className="mb-5 flex items-center gap-3"><span className="h-px w-8 bg-[#d91b1b]" /><h2 className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff535b]">{title}</h2></div><div className="grid gap-6 lg:grid-cols-2">{items.map((item) => <ContentCard item={item} mode={mode} key={item._id} />)}</div></section>;
}

function ContentCard({ item, mode }: { item: ContentItem; mode: "event" | "route" }) {
  return <article className="rebel-frame overflow-hidden rounded-3xl bg-[#0f0f0f]"><Media item={item} /><div className="p-5 sm:p-6"><div className="flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.12em] text-[#ff535b]"><span>{formatDate(item.date)}{item.endDate ? ` – ${formatDate(item.endDate)}` : ""}</span><span>{item.status}</span></div><h3 className="mt-3 font-display text-3xl text-[#e8d9c9]">{item.title}</h3>{mode === "route" ? <p className="mt-3 flex flex-wrap items-center gap-2 text-sm"><Route className="h-4 w-4 text-[#ff535b]" />{item.startLocation || "Start TBA"}<ArrowRight className="h-4 w-4" />{item.destination || "Destination TBA"}</p> : <p className="mt-3 flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-[#ff535b]" />{item.location || "Venue TBA"}</p>}<p className="mt-4 text-sm leading-7 text-muted-foreground">{item.description}</p></div></article>;
}

function Brands({ items }: { items: ContentItem[] }) {
  return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article className="brand-panel rebel-frame overflow-hidden rounded-2xl" key={item._id}><Media item={item} /><div className="p-5"><h2 className="brand-title font-display text-2xl">{item.title}</h2><p className="mt-2 font-mono text-xs uppercase text-[#ff535b]">{item.category}</p><p className="mt-4 text-sm leading-6 text-muted-foreground">{item.description}</p></div></article>)}</div>;
}

function Gallery({ items }: { items: ContentItem[] }) {
  return <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">{items.map((item) => <article className="rebel-frame mb-5 break-inside-avoid overflow-hidden rounded-2xl bg-[#0f0f0f]" key={item._id}><Media item={item} /><div className="p-5"><div className="flex items-center gap-2 font-mono text-xs uppercase text-[#ff535b]"><Camera className="h-4 w-4" />Road archive</div><h2 className="mt-3 font-display text-2xl">{item.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p></div></article>)}</div>;
}

function Media({ item }: { item: ContentItem }) {
  const images = item.images?.length ? item.images : item.image ? [item.image] : [];
  const videos = item.videos ?? [];
  if (!images.length && !videos.length) return <div className="flex h-52 items-center justify-center bg-[#120506]"><CalendarDays className="h-10 w-10 text-[#ff535b]" /></div>;
  return <div className={`grid ${images.length + videos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>{images.slice(0, 4).map((image, index) => <Image src={image.url} alt={`${item.title} ${index + 1}`} width={800} height={520} className="h-56 w-full object-cover" key={image.publicId} />)}{videos.map((video) => <video src={video.url} controls preload="metadata" className="h-56 w-full bg-black object-cover" key={video.publicId} />)}{item.videoUrl ? <a href={item.videoUrl} target="_blank" rel="noreferrer" className="flex h-56 items-center justify-center bg-[#120506] text-[#ff535b]"><Play className="h-10 w-10" /></a> : null}</div>;
}

function EmptyState() { return <div className="rebel-frame p-10 text-center"><h2 className="font-display text-3xl">Updates coming soon</h2><p className="mt-3 text-muted-foreground">The command center will publish new details here.</p></div>; }
function CallToAction() { return <section className="border-y border-red-900 bg-[#080808]"><div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-3xl">Ready to join the crew?</h2><p className="mt-2 text-muted-foreground">Register for membership and upcoming ride communication.</p></div><Button asChild size="lg"><Link href="/join-group">Join the ride <ArrowRight className="h-4 w-4" /></Link></Button></div></section>; }
function formatDate(date?: string) { return date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date TBA"; }
