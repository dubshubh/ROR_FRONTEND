import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bike,
  Compass,
  Flag,
  HeartHandshake,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Rebels on Roads",
  description: "Meet the founder and discover the purpose, values, and riding culture behind Rebels on Roads."
};

const values = [
  { icon: ShieldCheck, number: "01", title: "Ride responsible", text: "Preparation, discipline and respect for every rider sharing the road." },
  { icon: Users, number: "02", title: "Move as one", text: "A brotherhood where experience is shared and no rider is left behind." },
  { icon: HeartHandshake, number: "03", title: "Leave an impact", text: "Turning the energy of the riding community into awareness, service and change." }
];

const roadCode = [
  { icon: ShieldCheck, title: "Safety before speed", text: "Every memorable ride starts with preparation and returns with everyone safe." },
  { icon: Compass, title: "Purpose in every mile", text: "Adventure matters more when it creates connection, confidence and perspective." },
  { icon: HeartHandshake, title: "Community beyond machines", text: "The motorcycle brings us together; character and mutual respect keep us together." },
  { icon: Flag, title: "Pride with responsibility", text: "We represent our roads, our region and our riding culture with discipline." }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <PublicHeader />

      <section className="about-hero">
        <div className="about-hero-grid" aria-hidden="true" />
        <Image src="/images/rebels-on-roads-3d.png" alt="" fill priority className="about-hero-emblem" sizes="100vw" aria-hidden="true" />
        <div className="about-hero-glow" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:py-32 lg:py-40">
          <div className="max-w-4xl">
            <div className="about-eyebrow"><span /><Bike className="h-4 w-4" /> Born on the road. Built with purpose.</div>
            <h1 className="about-title mt-7">More than riders.<br /><span>We are a movement.</span></h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#bca99c] sm:text-lg">Rebels on Roads brings motorcycle enthusiasts together through responsible adventure, genuine brotherhood and a shared commitment to creating positive impact.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/join-group">Ride with us <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/calendar">Explore road calendar</Link></Button>
            </div>
          </div>
          <div className="about-manifesto" aria-label="Our foundation">
            <span><strong>Road</strong><small>Adventure</small></span>
            <i />
            <span><strong>Bond</strong><small>Brotherhood</small></span>
            <i />
            <span><strong>Cause</strong><small>Impact</small></span>
          </div>
        </div>
      </section>

      <section className="about-founder-section">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-[.88fr_1.12fr] lg:items-center lg:py-28">
          <div className="about-founder-visual">
            <div className="about-founder-number" aria-hidden="true">01</div>
            <div className="about-founder-image rebel-frame">
              <Image src="/images/param-arora.png" alt="Param Arora, founder of Rebels on Roads" width={800} height={1200} className="h-full w-full object-cover object-center" />
              <div className="about-founder-caption"><div><strong>Param Arora</strong><span>Founder · Rebels on Roads</span></div><MapPin className="h-5 w-5" /></div>
            </div>
            <div className="about-founder-stamp"><Bike className="h-6 w-6" /><span>Dehradun<br />Uttarakhand</span></div>
          </div>

          <div className="about-founder-copy">
            <p className="about-section-label"><Sparkles className="h-4 w-4" /> The story behind the throttle</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-[#e8d9c9] sm:text-6xl">One rider&apos;s vision.<br /><span className="text-[#ff535b]">A growing brotherhood.</span></h2>
            <Quote className="mt-8 h-9 w-9 text-[#722629]" aria-hidden="true" />
            <p className="about-quote">“The road is not only where we find adventure. It is where we learn discipline, build trust and discover what we can achieve together.”</p>
            <div className="mt-7 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
              <p>Param Arora founded Rebels on Roads to create a riding culture where passion and responsibility move together. What began with a love for motorcycles became a platform connecting riders from different walks of life.</p>
              <p>Under his leadership, the community brings riders together for adventure touring, awareness campaigns, charity initiatives and large-scale motorcycle events across Uttarakhand—always with safety, unity and social responsibility at the center.</p>
            </div>
            <div className="about-signature"><span>Driven by</span><strong>Purpose over noise.</strong></div>
          </div>
        </div>
      </section>

      <section className="about-values-section">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:py-28">
          <div className="about-section-heading">
            <div><p className="about-section-label"><Bike className="h-4 w-4" /> What drives us</p><h2 className="mt-4 font-display text-4xl text-[#e8d9c9] sm:text-6xl">Our throttle has a conscience.</h2></div>
            <p>Adventure is only meaningful when it is backed by discipline, respect and a reason bigger than the ride itself.</p>
          </div>
          <div className="about-value-grid">
            {values.map(({ icon: Icon, number, title, text }) => <article className="about-value-card" key={title}><span className="about-value-number">{number}</span><div className="about-value-icon"><Icon className="h-6 w-6" /></div><h3>{title}</h3><p>{text}</p><span className="about-value-line" /></article>)}
          </div>
        </div>
      </section>

      <section className="about-code-section">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-[.8fr_1.2fr] lg:items-start lg:py-28">
          <div className="lg:sticky lg:top-28">
            <p className="about-section-label"><ShieldCheck className="h-4 w-4" /> The ROR road code</p>
            <h2 className="mt-4 font-display text-4xl text-[#e8d9c9] sm:text-6xl">How we show up on every road.</h2>
            <p className="mt-6 max-w-md leading-7 text-muted-foreground">These principles guide our rides, our events and the way we represent the motorcycle community.</p>
          </div>
          <div className="about-code-list">
            {roadCode.map(({ icon: Icon, title, text }, index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div className="about-code-icon"><Icon className="h-5 w-5" /></div><div><h3>{title}</h3><p>{text}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 lg:pb-28">
        <div className="about-cta rebel-frame">
          <div className="about-cta-light" aria-hidden="true" />
          <div className="relative z-10"><p className="about-section-label"><Bike className="h-4 w-4" /> Your next chapter starts here</p><h2 className="mt-4 max-w-3xl font-display text-4xl text-white sm:text-6xl">The road is calling.<br />Don&apos;t ride it alone.</h2><p className="mt-5 max-w-xl leading-7 text-[#bca99c]">Join a community that values the journey, the people beside you and the impact left behind.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/join-group">Join Rebels on Roads <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline"><Link href="/contact">Talk to the team</Link></Button></div></div>
          <Image src="/images/rebels-on-roads-3d.png" alt="" width={620} height={620} className="about-cta-emblem" aria-hidden="true" />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
