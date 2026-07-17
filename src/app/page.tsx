import Link from "next/link";
import { ArrowRight, BadgeCheck, Bike, CalendarDays, Camera, Compass, Handshake, Mail, MapPin, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicContent } from "@/services/content.service";

const upcomingEvents = [
  {
    title: "Sunrise Ride to Alibaug",
    date: "20 Jul 2026",
    description: "A dawn ride with scenic stops, breakfast at the coast, and a relaxed pace for every rider."
  },
  {
    title: "Night Drift Meet",
    date: "2 Aug 2026",
    description: "A curated meetup for riders who want a polished group ride and photo challenge under the city lights."
  }
];

const completedEvents = [
  {
    title: "Monsoon Picnic Run",
    detail: "Completed with 42 riders and a flawless route plan."
  },
  {
    title: "Festival Glow Parade",
    detail: "A signature city ride that brought together the crew for a memorable night."
  }
];

const brandPartners = [
  { name: "Axor", category: "Helmets & riding protection" },
  { name: "LoneRanger", category: "Motorcycle luggage & gear" },
  { name: "EJEAS", category: "Rider communication systems" },
  { name: "Areoster", category: "Performance riding equipment" },
  { name: "Grand Pitstop", category: "Motorcycle care & accessories" }
];

const galleryShots = [
  {
    title: "Open Road Energy",
    description: "A high-energy ride through the hills and curves of the weekend escape.",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Crew in Motion",
    description: "The brotherhood captured in perfect formation during a long-distance run.",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa0e1e4?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Afterglow Gathering",
    description: "A warm evening after the ride, filled with stories, smiles, and the road ahead.",
    image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80"
  }
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let rides = upcomingEvents;
  let pastRides = completedEvents;
  let partners = brandPartners;
  let photos = galleryShots;
  try {
    const content = await getPublicContent();
    const upcoming = content.rides.filter((item) => item.status === "upcoming");
    const completed = content.rides.filter((item) => item.status === "completed");
    if (upcoming.length) rides = upcoming.map((item) => ({
      title: item.title,
      date: item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date to be announced",
      description: [item.description, item.location].filter(Boolean).join(" · ")
    }));
    if (completed.length) pastRides = completed.map((item) => ({ title: item.title, detail: item.description }));
    if (content.brands.length) partners = content.brands.map((item) => ({ name: item.title, category: item.category || item.description }));
    if (content.photos.length) photos = content.photos.filter((item) => item.image).map((item) => ({ title: item.title, description: item.description, image: item.image!.url }));
  } catch {
    // Keep the public page available while the API is starting or temporarily offline.
  }
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />

      <section id="home" className="hero-3d border-b-2 border-red-600">
        <div className="hero-3d__emblem" aria-hidden="true" />
        <div className="hero-3d__shade" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid min-h-[680px] max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6 lg:max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d91b1b] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[#d91b1b]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Rebels on Roads
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-4xl text-[#e8d9c9] sm:text-6xl lg:text-7xl">
                Ride bold. Build bonds. Own the road.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#e8d9c9] sm:text-lg">
                Welcome to the home of premium rides, curated events, and a community that values discipline, style, and brotherhood.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/join-group">
                  Join the ride
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </div>

          <div className="rebel-frame hero-command-card rounded-3xl border border-[#d91b1b] p-6">
            <div className="flex items-center gap-3 text-[#d91b1b]">
              <Bike className="h-5 w-5" />
              <span className="font-mono-label text-[11px] uppercase tracking-[0.25em]">Road command center</span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-red-900 bg-[#1a1a1a] p-4">
                <p className="text-sm text-[#e8d9c9]">Next launch</p>
                <p className="mt-1 font-display text-2xl text-[#d91b1b]">Sunrise ride to Alibaug</p>
                <p className="mt-2 text-sm text-muted-foreground">Ride start: 5:30 AM • Meet point: Gateway of the city</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-red-900 bg-[#1a1a1a] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d91b1b]">Members</p>
                  <p className="mt-2 font-display text-3xl text-[#e8d9c9]">120+</p>
                </div>
                <div className="rounded-2xl border border-red-900 bg-[#1a1a1a] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d91b1b]">Runs</p>
                  <p className="mt-2 font-display text-3xl text-[#e8d9c9]">35</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="font-mono-label text-sm uppercase tracking-[0.25em] text-[#d91b1b]">About the club</p>
            <h2 className="mt-3 font-display text-3xl text-[#e8d9c9] sm:text-4xl">Built for riders who value style, safety, and story.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Rebels on Roads is not just about the destination. It is about the discipline of each ride, the friendships formed on the way, and the memories captured every mile.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Safety first", "Every ride is planned with route safety, check-ins, and rider support."],
              ["Curated routes", "From city meets to sunrise escapes, every event is designed for the experience."],
              ["Photography moments", "Every ride is documented so the energy of the crew lives beyond the event."],
              ["Community focus", "New riders are welcomed, guided, and embraced by the group."],
            ].map(([title, text]) => (
              <div key={title} className="rebel-frame rounded-2xl border border-red-900 bg-[#0f0f0f] p-4">
                <h3 className="font-display text-xl text-[#d91b1b]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="border-y border-red-900 bg-[#050505]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-[#d91b1b]">
              <CalendarDays className="h-5 w-5" />
              <p className="font-mono-label text-sm uppercase tracking-[0.25em]">Upcoming events</p>
            </div>
            <div className="mt-6 space-y-4">
              {rides.map((event) => (
                <Card key={event.title} className="border-red-900 bg-[#0f0f0f]">
                  <CardHeader>
                    <CardTitle className="text-[#e8d9c9]">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#d91b1b]">{event.date}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-[#d91b1b]">
              <Compass className="h-5 w-5" />
              <p className="font-mono-label text-sm uppercase tracking-[0.25em]">Completed events</p>
            </div>
            <div className="mt-6 space-y-4">
              {pastRides.map((event) => (
                <Card key={event.title} className="border-red-900 bg-[#0f0f0f]">
                  <CardHeader>
                    <CardTitle className="text-[#e8d9c9]">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">{event.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="partners" className="relative overflow-hidden border-b border-red-900 bg-[#080808]">
        <div className="checkered-strip absolute inset-x-0 top-0 h-2 opacity-70" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#d91b1b]">
                <Handshake className="h-5 w-5" />
                <p className="font-mono-label text-sm uppercase tracking-[0.25em]">Brand partners</p>
              </div>
              <h2 className="mt-3 max-w-3xl font-display text-3xl text-[#e8d9c9] sm:text-5xl">
                Trusted by the brands that power every ride.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-right">
              Proud partners supporting our riders with protection, communication, touring equipment, and dependable motorcycle care.
            </p>
          </div>

          <div className="motion-stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {partners.map((partner, index) => (
              <article key={partner.name} className="brand-panel rebel-hover group min-h-48 border border-red-900 p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#d91b1b]">
                    Partner {String(index + 1).padStart(2, "0")}
                  </span>
                  <BadgeCheck className="h-5 w-5 text-[#d4af37]" aria-hidden="true" />
                </div>
                <div className="mt-9">
                  <h3 className="brand-title font-display text-2xl leading-none">{partner.name}</h3>
                  <div className="mt-4 h-px w-12 bg-[#d91b1b] transition-all duration-300 group-hover:w-full" />
                  <p className="mt-4 text-xs leading-5 text-muted-foreground">{partner.category}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-red-900/70 pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Built together. Tested on the road.
            </p>
            <Button asChild variant="outline">
              <Link href="/contact">Become a partner <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono-label text-sm uppercase tracking-[0.25em] text-[#d91b1b]">Photography</p>
            <h2 className="mt-2 font-display text-3xl text-[#e8d9c9] sm:text-4xl">Moments captured from the road</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/contact">Book a ride</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {photos.map((shot) => (
            <div key={shot.title} className="overflow-hidden rounded-3xl border border-red-900 bg-[#0f0f0f]">
              <img src={shot.image} alt={shot.title} className="h-56 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-center gap-2 text-[#d91b1b]">
                  <Camera className="h-4 w-4" />
                  <h3 className="font-display text-xl text-[#e8d9c9]">{shot.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{shot.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rebel-frame rounded-3xl border border-[#d91b1b] bg-[#0a0a0a] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="font-mono-label text-sm uppercase tracking-[0.25em] text-[#d91b1b]">Contact</p>
              <h2 className="mt-2 font-display text-3xl text-[#e8d9c9] sm:text-4xl">Ready for the next ride?</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                Reach out to the crew for event updates, membership questions, or to join an upcoming run.
              </p>
            </div>
            <div className="space-y-3 rounded-2xl border border-red-900 bg-[#0f0f0f] p-5">
              <div className="flex items-center gap-3 text-sm text-[#e8d9c9]">
                <Mail className="h-4 w-4 text-[#d91b1b]" />
                <span>support@rebelsonroads.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#e8d9c9]">
                <MapPin className="h-4 w-4 text-[#d91b1b]" />
                <span>Based in Mumbai • Travel across the city and coast</span>
              </div>
              <Button asChild className="mt-2 w-full">
                <Link href="/contact">Open contact page</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
