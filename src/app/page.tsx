import Link from "next/link";
import { ArrowRight, Bike, CalendarDays, Camera, Handshake, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/services/settings.service";

export const dynamic = "force-dynamic";

const exploreLinks = [
  { href: "/calendar", title: "Road Calendar", text: "Events, chapter rides and intercity missions in one live schedule.", icon: CalendarDays },
  { href: "/photography", title: "Photography", text: "Road stories captured across every chapter.", icon: Camera },
  { href: "/partners", title: "Partners", text: "Brands and organizations supporting the crew.", icon: Handshake }
];

export default async function HomePage() {
  let commandCenter = { launchTitle: "Next ride announcement coming soon", launchDetails: "Follow the official channels for route and assembly updates", membersCount: "120+", runsCount: "35" };
  try { const settings = await getSiteSettings(); if (settings.commandCenter) commandCenter = settings.commandCenter; } catch { /* Keep the landing page available while the API starts. */ }

  return <main className="min-h-screen bg-background"><PublicHeader />
    <section className="hero-3d border-b-2 border-red-600">
      <div className="hero-3d__emblem" aria-hidden="true" /><div className="hero-3d__shade" aria-hidden="true" />
      <div className="relative z-10 mx-auto grid min-h-[620px] max-w-6xl gap-8 px-4 py-14 sm:min-h-[680px] sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6 lg:max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-[#d91b1b] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.25em] text-[#ff535b]"><ShieldCheck className="h-3.5 w-3.5" />Official riding community</div><h1 className="font-display text-4xl leading-tight text-[#e8d9c9] sm:text-6xl lg:text-7xl">Ride bold. Build bonds. Own the road.</h1><p className="max-w-2xl text-base leading-7 text-[#e8d9c9] sm:text-lg">Premium rides, disciplined formations and a community built around safety, respect and brotherhood.</p><div className="flex flex-wrap gap-4"><Button asChild size="lg"><Link href="/join-group">Join the crew <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline" size="lg"><Link href="/rides">Explore rides</Link></Button></div></div>
        <div className="rebel-frame hero-command-card rounded-3xl p-6"><div className="flex items-center gap-3 text-[#ff535b]"><Bike className="h-5 w-5" /><span className="font-mono text-xs uppercase">Road command center</span></div><div className="mt-6 rounded-2xl border border-red-900 bg-[#1a1a1a] p-5"><p className="text-sm text-[#e8d9c9]">Next launch</p><p className="mt-2 font-display text-3xl text-[#ff535b]">{commandCenter.launchTitle}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{commandCenter.launchDetails}</p></div><div className="mt-4 grid grid-cols-2 gap-4"><Stat label="Members" value={commandCenter.membersCount} /><Stat label="Runs" value={commandCenter.runsCount} /></div></div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20"><div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[0.25em] text-[#ff535b]">Explore Rebels on Roads</p><h2 className="mt-3 font-display text-4xl text-[#e8d9c9] sm:text-5xl">Everything has its own destination.</h2><p className="mt-4 text-base leading-7 text-muted-foreground">Use the dedicated pages to find current information without scrolling through one oversized homepage.</p></div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{exploreLinks.map(({ href, title, text, icon: Icon }) => <Link href={href} className="brand-panel rebel-frame rebel-hover group rounded-2xl p-6" key={href}><Icon className="h-6 w-6 text-[#ff535b]" /><h3 className="mt-8 font-display text-3xl text-[#e8d9c9]">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p><span className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase text-[#ff535b]">Open page <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>)}</div></section>

    <section className="border-y border-red-900 bg-[#080808]"><div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="font-mono text-xs uppercase tracking-[0.25em] text-[#ff535b]">Membership</p><h2 className="mt-2 font-display text-4xl">Ready for the next ride?</h2><p className="mt-3 text-muted-foreground">Submit your rider application for verification by the road captain.</p></div><div className="flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/join-group">Register now</Link></Button><Button asChild size="lg" variant="outline"><Link href="/contact">Contact the crew</Link></Button></div></div></section>
    <SiteFooter />
  </main>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-red-900 bg-[#1a1a1a] p-4"><p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ff535b]">{label}</p><p className="mt-2 font-display text-4xl text-[#e8d9c9]">{value}</p></div>; }
