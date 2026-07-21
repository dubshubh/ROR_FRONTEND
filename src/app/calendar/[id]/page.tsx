import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bike, CalendarDays, MapPin, MapPinned, Route, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { loadPublicContent } from "@/lib/public-content";

export const metadata: Metadata = { title: "Road Briefing", description: "Complete Rebels on Roads event or ride details." };

export default async function CalendarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await loadPublicContent();
  const item = [...content.events, ...content.rides, ...content.intercity].find((entry) => entry._id === id);
  if (!item) notFound();
  const config = item.kind === "event" ? { label: "Event", icon: CalendarDays, color: "text-amber-300" } : item.kind === "intercity" ? { label: "Intercity mission", icon: MapPinned, color: "text-teal-300" } : { label: "Chapter ride", icon: Bike, color: "text-[#ff535b]" };
  const Icon = config.icon;
  const images = item.images?.length ? item.images : item.image ? [item.image] : [];

  return <main className="min-h-screen bg-background"><PublicHeader /><article>
    <section className="relative overflow-hidden border-b-2 border-red-600 bg-[#080808]"><div className="checkered-strip absolute inset-x-0 top-0 h-2 opacity-70" />{images[0] ? <div className="absolute inset-0"><Image src={images[0].url} alt="" fill priority className="object-cover opacity-20" /><div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/90 to-[#080808]/50" /></div> : null}<div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-24"><Link href="/calendar" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-[#ff535b]"><ArrowLeft className="h-4 w-4" />Back to road calendar</Link><div className={`mt-8 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] ${config.color}`}><Icon className="h-5 w-5" />{config.label}<span className="border border-current px-2 py-1 text-[9px]">{item.status}</span></div><h1 className="mt-4 max-w-4xl font-display text-4xl leading-tight text-[#e8d9c9] sm:text-7xl">{item.title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-[#d8c9ba]">{item.description}</p></div></section>

    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_340px]"><div>{images.length ? <div className={`grid gap-3 ${images.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}>{images.map((image, index) => <div className="rebel-frame relative min-h-64 overflow-hidden rounded-2xl sm:min-h-80" key={image.publicId}><Image src={image.url} alt={`${item.title} ${index + 1}`} fill className="object-cover transition duration-500 hover:scale-[1.03]" /></div>)}</div> : <div className="rebel-frame flex min-h-64 items-center justify-center bg-[#100808]"><Route className="h-14 w-14 text-[#ff535b]" /></div>}{item.videos?.length ? <div className="mt-4 grid gap-4">{item.videos.map((video) => <video src={video.url} controls preload="metadata" className="rebel-frame w-full bg-black" key={video.publicId} />)}</div> : null}</div>
      <aside className="space-y-4"><BriefingCard icon={CalendarDays} label="Schedule" value={`${formatDate(item.date)}${item.endDate ? ` – ${formatDate(item.endDate)}` : ""}`} />{item.kind === "event" ? <BriefingCard icon={MapPin} label="Venue" value={item.location || "To be announced"} /> : <><BriefingCard icon={MapPin} label="Assembly" value={item.startLocation || "To be announced"} /><BriefingCard icon={MapPinned} label="Destination" value={item.destination || "To be announced"} /></>}{item.routeWaypoints?.length ? <div className="rebel-frame bg-[#0f0f0f] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff535b]">Route checkpoints</p><ol className="mt-4 space-y-3">{item.routeWaypoints.map((point, index) => <li className="flex gap-3 text-sm" key={`${point}-${index}`}><span className="font-mono text-xs text-[#ff535b]">{String(index + 1).padStart(2, "0")}</span>{point}</li>)}</ol></div> : null}<div className="rebel-frame bg-[#0f0f0f] p-5"><div className="flex items-center gap-2 text-[#ff535b]"><ShieldCheck className="h-5 w-5" /><p className="font-mono text-[10px] uppercase tracking-[0.16em]">Road discipline</p></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Final assembly, safety and formation instructions are issued by the road captain. Arrive prepared and follow the crew briefing.</p><Button asChild className="mt-5 w-full"><Link href="/join-group">Join the crew</Link></Button></div></aside>
    </section>
  </article><SiteFooter /></main>;
}

function BriefingCard({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) { return <div className="rebel-frame bg-[#0f0f0f] p-5"><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff535b]"><Icon className="h-4 w-4" />{label}</div><p className="mt-3 font-display text-xl text-[#e8d9c9]">{value}</p></div>; }
function formatDate(date?: string) { return date ? new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "Date to be announced"; }
