import Link from "next/link";
import { ArrowRight, Bike, CalendarDays, Camera, Handshake, Mail, MapPin, MapPinned, Play, Route, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { getPublicContent } from "@/services/content.service";
import { getSiteSettings } from "@/services/settings.service";
import { ContentItem, PublicContent } from "@/types/content";

export const dynamic = "force-dynamic";

const emptyContent: PublicContent = { events: [], rides: [], intercity: [], brands: [], photos: [] };

export default async function HomePage() {
  let content = emptyContent;
  let commandCenter = { launchTitle: "Sunrise Ride to Alibaug", launchDetails: "Ride start: 5:30 AM · Meet point: Gateway of the city", membersCount: "120+", runsCount: "35" };
  try {
    const [liveContent, settings] = await Promise.all([getPublicContent(), getSiteSettings()]);
    content = { ...emptyContent, ...liveContent };
    if (settings.commandCenter) commandCenter = settings.commandCenter;
  } catch {
    // The core page stays available while the API is starting.
  }

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />
      <section id="home" className="hero-3d border-b-2 border-red-600">
        <div className="hero-3d__emblem" aria-hidden="true" /><div className="hero-3d__shade" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid min-h-[620px] max-w-6xl gap-8 px-4 py-12 sm:min-h-[680px] sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6 lg:max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d91b1b] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[#d91b1b]"><ShieldCheck className="h-3.5 w-3.5" /> Rebels on Roads</div>
            <h1 className="font-display text-4xl leading-tight text-[#e8d9c9] sm:text-6xl lg:text-7xl">Ride bold. Build bonds. Own the road.</h1>
            <p className="max-w-2xl text-base leading-7 text-[#e8d9c9] sm:text-lg">Welcome to the home of premium rides, curated events, and a community that values discipline, style, and brotherhood.</p>
            <div className="flex flex-wrap gap-4"><Button asChild size="lg"><Link href="/join-group">Join the ride <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline" size="lg"><Link href="/contact">Contact us</Link></Button></div>
          </div>
          <div className="rebel-frame hero-command-card rounded-3xl border border-[#d91b1b] p-6">
            <div className="flex items-center gap-3 text-[#d91b1b]"><Bike className="h-5 w-5" /><span className="font-mono text-xs uppercase">Road Command Center</span></div>
            <div className="mt-6 rounded-2xl border border-red-900 bg-[#1a1a1a] p-5"><p className="text-sm text-[#e8d9c9]">Next launch</p><p className="mt-2 font-display text-3xl text-[#d91b1b]">{commandCenter.launchTitle}</p><p className="mt-2 text-sm text-muted-foreground">{commandCenter.launchDetails}</p></div>
            <div className="mt-4 grid grid-cols-2 gap-4"><Stat label="Members" value={commandCenter.membersCount} /><Stat label="Runs" value={commandCenter.runsCount} /></div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-16">
        <p className="font-mono-label text-sm uppercase tracking-[0.25em] text-[#d91b1b]">About the club</p><h2 className="mt-3 max-w-3xl font-display text-3xl text-[#e8d9c9] sm:text-4xl">Built for riders who value style, safety, and story.</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">Rebels on Roads is not just about the destination. It is about the discipline of each ride, the friendships formed on the way, and the memories captured every mile.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3"><Info title="Safety first" text="Every route includes regroup points, timing, check-ins, and rider support." /><Info title="Curated routes" text="From local meets to intercity launches, every journey is designed for the experience." /><Info title="Community focus" text="Members ride with respect, maintain formation, and look after the whole crew." /></div>
      </section>

      <ContentBand id="events" icon={CalendarDays} eyebrow="Events" title="Meetups, launches, and community moments" items={content.events} empty="Event details and galleries will appear here." mode="event" />
      <ContentBand id="rides" icon={Route} eyebrow="Rides" title="Routes built for the crew" items={content.rides} empty="Upcoming and completed ride details will appear here." mode="route" />

      <section id="partners" className="relative overflow-hidden border-y border-red-900 bg-[#080808]">
        <div className="checkered-strip absolute inset-x-0 top-0 h-2 opacity-70" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <Heading icon={Handshake} eyebrow="Brand Partners" title="Brands that support the road" />
          {content.brands.length ? <div className="motion-stagger mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{content.brands.map((brand) => <article key={brand._id} className="brand-panel rebel-frame rebel-hover overflow-hidden rounded-2xl border border-red-900 bg-[#111]"><MediaGrid item={brand} /><div className="p-5"><h3 className="brand-title font-display text-2xl text-[#e8d9c9]">{brand.title}</h3><div className="mt-3 h-px w-12 bg-[#d91b1b]" /><p className="mt-3 text-sm text-[#d91b1b]">{brand.category}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{brand.description}</p></div></article>)}</div> : <Empty text="Brand logos, details, and ROR collaboration pictures will appear here." />}
          <div className="mt-8"><Button asChild variant="outline"><Link href="/contact#partner">Become a partner <ArrowRight className="h-4 w-4" /></Link></Button></div>
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-6xl px-4 py-16">
        <Heading icon={Camera} eyebrow="Photography" title="Photos and videos from every chapter" />
        {content.photos.length ? <div className="motion-stagger mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">{content.photos.map((item) => <article key={item._id} className="rebel-frame rebel-hover mb-5 break-inside-avoid overflow-hidden rounded-3xl border border-red-900 bg-[#0f0f0f]"><MediaGrid item={item} /><div className="p-5"><div className="flex items-center gap-2 text-[#d91b1b]"><Camera className="h-4 w-4" /><h3 className="font-display text-xl text-[#e8d9c9]">{item.title}</h3></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>{item.videoUrl ? <Button asChild className="mt-4" variant="outline" size="sm"><a href={item.videoUrl} target="_blank" rel="noreferrer"><Play className="h-4 w-4" /> Watch video</a></Button> : null}</div></article>)}</div> : <Empty text="The complete ROR photo and video archive will appear here." />}
      </section>

      <ContentBand id="intercity" icon={MapPinned} eyebrow="Intercity Rides" title="Long routes beyond city limits" items={content.intercity} empty="Intercity dates, start points, destinations, and photos will appear here." mode="route" />

      <section id="contact" className="mx-auto max-w-6xl px-4 py-16"><div className="rebel-frame rounded-3xl border border-[#d91b1b] bg-[#0a0a0a] p-8 md:p-10"><div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center"><div><p className="font-mono-label text-sm uppercase tracking-[0.25em] text-[#d91b1b]">Contact</p><h2 className="mt-2 font-display text-3xl text-[#e8d9c9] sm:text-4xl">Ready for the next ride?</h2><p className="mt-4 text-muted-foreground">Reach out for event updates, membership questions, or partnership enquiries.</p></div><div className="space-y-3 rounded-2xl border border-red-900 bg-[#0f0f0f] p-5"><span className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-[#d91b1b]" />support@rebelsonroads.com</span><span className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-[#d91b1b]" />Based in Dehradun</span><Button asChild className="mt-2 w-full"><Link href="/contact">Open contact page</Link></Button></div></div></div></section>
      <SiteFooter />
    </main>
  );
}

function ContentBand({ id, icon, eyebrow, title, items, empty, mode }: { id: string; icon: typeof Bike; eyebrow: string; title: string; items: ContentItem[]; empty: string; mode: "event" | "route" }) {
  return <section id={id} className="border-y border-red-900 bg-[#050505]"><div className="mx-auto max-w-6xl px-4 py-16"><Heading icon={icon} eyebrow={eyebrow} title={title} />{items.length ? <div className="motion-stagger mt-8 grid gap-6 lg:grid-cols-2">{items.map((item) => <article key={item._id} className="rebel-frame rebel-hover overflow-hidden rounded-3xl border border-red-900 bg-[#0f0f0f]"><MediaGrid item={item} /><div className="p-5"><div className="flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.12em] text-[#d91b1b]"><span>{formatDate(item.date)}{item.endDate ? ` - ${formatDate(item.endDate)}` : ""}</span><span>{item.status}</span></div><h3 className="mt-3 font-display text-3xl text-[#e8d9c9]">{item.title}</h3>{mode === "route" ? <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#e8d9c9]"><MapPin className="h-4 w-4 text-[#d91b1b]" />{item.startLocation || "Start TBA"} <ArrowRight className="h-4 w-4" /> {item.destination || "Destination TBA"}</p> : <p className="mt-2 text-sm text-[#e8d9c9]">{item.location}</p>}<p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p></div></article>)}</div> : <Empty text={empty} />}</div></section>;
}

function MediaGrid({ item }: { item: ContentItem }) {
  const images = item.images?.length ? item.images : item.image ? [item.image] : [];
  const videos = item.videos ?? [];
  if (!images.length && !videos.length) return null;
  return <div className={`grid ${images.length + videos.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>{images.slice(0, 4).map((image, index) => <img key={image.publicId} src={image.url} alt={`${item.title} ${index + 1}`} className="h-52 w-full object-cover sm:h-48" />)}{videos.map((video) => <video key={video.publicId} src={video.url} controls preload="metadata" className="h-52 w-full bg-black object-cover sm:h-48" />)}</div>;
}
function Heading({ icon: Icon, eyebrow, title }: { icon: typeof Bike; eyebrow: string; title: string }) { return <div><p className="flex items-center gap-2 font-mono text-xs uppercase text-[#d91b1b]"><Icon className="h-5 w-5" />{eyebrow}</p><h2 className="mt-3 font-display text-4xl text-[#e8d9c9]">{title}</h2></div>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-red-900 bg-[#1a1a1a] p-4"><p className="text-xs uppercase tracking-[0.2em] text-[#d91b1b]">{label}</p><p className="mt-2 font-display text-4xl text-[#e8d9c9]">{value}</p></div>; }
function Info({ title, text }: { title: string; text: string }) { return <div className="rebel-frame rounded-2xl border border-red-900 bg-[#0f0f0f] p-5"><h3 className="font-display text-2xl text-[#d91b1b]">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p></div>; }
function Empty({ text }: { text: string }) { return <div className="mt-8 border border-dashed border-red-900 p-8 text-sm text-muted-foreground">{text}</div>; }
function formatDate(date?: string) { return date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date TBA"; }
