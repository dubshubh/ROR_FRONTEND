import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, CalendarDays, Camera, ChevronRight, Clock3, Handshake, MapPin, MapPinned, Route, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { loadPublicContent } from "@/lib/public-content";
import { getSiteSettings } from "@/services/settings.service";
import type { ContentItem } from "@/types/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rebels on Roads", description: "Responsible rides, real brotherhood, and road experiences from Rebels on Roads." };

const exploreLinks = [
  { href: "/calendar", title: "Road Calendar", label: "Ride plans", text: "Events, chapter rides and intercity missions in one live schedule.", icon: CalendarDays },
  { href: "/photography", title: "Road Archive", label: "Photos & films", text: "The machines, people and moments captured between destinations.", icon: Camera },
  { href: "/partners", title: "Brand Partners", label: "Shared direction", text: "Meet the brands building meaningful road experiences beside us.", icon: Handshake }
];

export default async function HomePage() {
  let commandCenter = { launchTitle: "Next ride announcement coming soon", launchDetails: "Follow the official channels for route and assembly updates", membersCount: "120+", runsCount: "35" };
  let missions: ContentItem[] = [];
  const [settingsResult, contentResult] = await Promise.allSettled([getSiteSettings(), loadPublicContent()]);
  if (settingsResult.status === "fulfilled" && settingsResult.value.commandCenter) commandCenter = settingsResult.value.commandCenter;
  if (contentResult.status === "fulfilled") missions = [...contentResult.value.events, ...contentResult.value.rides, ...contentResult.value.intercity];
  const nextMission = getNextMission(missions);

  return <main className="home-page min-h-screen bg-[#070707]"><PublicHeader />
    <section className="home-hero">
      <div className="home-hero-art" aria-hidden="true" />
      <div className="home-hero-grid" aria-hidden="true" />
      <div className="relative z-10 mx-auto grid min-h-[720px] max-w-6xl gap-12 px-4 py-20 lg:grid-cols-[1.12fr_.88fr] lg:items-center lg:py-28">
        <div className="home-hero-copy"><p className="home-label"><span /> Official riding community · Dehradun</p><h1>Ride with<br /><em>purpose.</em></h1><p>Disciplined formations. Unforgettable roads. A brotherhood built on trust, safety and the stories we bring home.</p><div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/join-group">Join the crew <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline"><Link href="/calendar">Explore road calendar</Link></Button></div><div className="home-hero-proof"><ShieldCheck /><span><strong>Safety-led</strong><small>Every road starts with a briefing</small></span><Users /><span><strong>Community-built</strong><small>No rider left behind</small></span></div></div>
        <NextMission mission={nextMission} fallback={commandCenter} />
      </div>
      <div className="home-scroll-cue"><span>Explore</span><i /></div>
    </section>

    <section className="home-stats"><div><span><strong>{commandCenter.membersCount}</strong><small>Registered riders</small></span><i /><span><strong>{commandCenter.runsCount}</strong><small>Road missions</small></span><i /><span><strong>01</strong><small>Brotherhood</small></span><p>Ride with discipline · Return with stories</p></div></section>

    <section className="mx-auto max-w-6xl px-4 py-20 lg:py-28"><div className="home-section-heading"><div><p className="home-label"><span /> Find your road</p><h2>Everything has<br />its own destination.</h2></div><p>One community, clearly organized. Find the schedule, experience the archive or discover the partners who share our direction.</p></div><div className="home-explore-grid">{exploreLinks.map(({ href, title, label, text, icon: Icon }, index) => <Link href={href} className="home-explore-card" key={href}><span className="home-explore-index">0{index + 1}</span><div className="home-explore-icon"><Icon /></div><p>{label}</p><h3>{title}</h3><small>{text}</small><strong>Open destination <ChevronRight /></strong></Link>)}</div></section>

    <section className="home-code"><div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-28"><div><p className="home-label"><span /> Our road code</p><h2>Adventure earns respect through discipline.</h2><p className="mt-6 max-w-xl leading-8 text-[#948076]">We ride for the thrill of the road, but we are remembered for how we treat the people on it. Preparation, formation and mutual respect define every ROR journey.</p><Button asChild variant="outline" className="mt-8"><Link href="/about">Why we ride <ArrowRight className="h-4 w-4" /></Link></Button></div><div className="home-code-list"><article><ShieldCheck /><span><strong>Safety before speed</strong><small>Prepared riders create better stories.</small></span><b>01</b></article><article><Users /><span><strong>Move as one</strong><small>The crew arrives together.</small></span><b>02</b></article><article><Route /><span><strong>Purpose in every mile</strong><small>Leave the road better than we found it.</small></span><b>03</b></article></div></div></section>

    <section className="mx-auto max-w-6xl px-4 py-20 lg:py-28"><div className="home-cta rebel-frame"><div><p className="home-label"><Sparkles className="h-4 w-4" /> Your road starts here</p><h2>Ready to earn<br />your place?</h2><p>Submit your rider application. The command center reviews every member before approval.</p><div><Button asChild size="lg"><Link href="/join-group">Start application <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline"><Link href="/contact">Contact the crew</Link></Button></div></div><Bike className="home-cta-bike" aria-hidden="true" /></div></section>
    <SiteFooter />
  </main>;
}

function NextMission({ mission, fallback }: { mission?: ContentItem; fallback: { launchTitle: string; launchDetails: string } }) {
  const image = mission?.images?.[0] ?? mission?.image;
  const location = mission ? mission.kind === "event" ? mission.location : [mission.startLocation, mission.destination].filter(Boolean).join(" → ") : fallback.launchDetails;
  return <article className="home-next-card">
    <div className="home-next-media">{image ? <Image src={image.url} alt={mission!.title} fill priority sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" /> : <div className="home-next-placeholder"><Bike /></div>}<span className="home-next-shade" /><span className="home-next-live"><i /> Next on the road</span></div>
    <div className="home-next-body"><div className="home-next-type">{mission?.kind === "intercity" ? <MapPinned /> : mission?.kind === "event" ? <CalendarDays /> : <Bike />}<span>{mission?.kind || "Ride briefing"}</span>{mission?.status ? <b>{mission.status}</b> : null}</div><h2>{mission?.title || fallback.launchTitle}</h2>{mission?.date ? <div className="home-next-date"><strong>{new Date(mission.date).toLocaleDateString("en-IN", { day: "2-digit" })}</strong><span>{new Date(mission.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span><Clock3 /></div> : null}<p><MapPin />{location || "Route briefing coming soon"}</p>{mission ? <Link href={`/calendar/${mission._id}`}>View mission details <ArrowRight /></Link> : <Link href="/calendar">Open road calendar <ArrowRight /></Link>}</div>
  </article>;
}

function getNextMission(items: ContentItem[]) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return [...items].filter((item) => item.date && item.status !== "completed" && new Date(item.date) >= now).sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())[0]
    ?? [...items].filter((item) => item.date).sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0];
}
