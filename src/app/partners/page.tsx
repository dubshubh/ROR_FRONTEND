import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Bike, Handshake, HeartHandshake, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { loadPublicContent } from "@/lib/public-content";
import type { ContentItem } from "@/types/content";

export const metadata: Metadata = {
  title: "Brand Partners",
  description: "Meet the brands that share the road, values, and community vision of Rebels on Roads."
};

const sharedGround = [
  { icon: ShieldCheck, title: "Trust", text: "Products, people and promises the riding community can depend on." },
  { icon: Target, title: "Purpose", text: "Collaborations designed around genuine value—not surface-level visibility." },
  { icon: Users, title: "Community", text: "A shared belief that strong communities are built through real experiences." }
];

export default async function PartnersPage() {
  const { brands } = await loadPublicContent();

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <PublicHeader />

      <section className="partners-hero">
        <div className="partners-hero-lines" aria-hidden="true" />
        <Image src="/images/rebels-on-roads-3d.png" alt="" fill priority sizes="100vw" className="partners-hero-emblem" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <div className="max-w-4xl">
            <p className="partners-label"><Handshake className="h-4 w-4" /> Built together. Driven together.</p>
            <h1 className="partners-title mt-6">Partners in the<br /><span>same direction.</span></h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#b7a398] sm:text-lg">The strongest partnerships are not just logos beside each other. They begin with common thinking, mutual trust and a shared ambition to move the riding community forward.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="#partner-grid">Meet our partners <ArrowUpRight className="h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline"><Link href="/contact">Collaborate with ROR</Link></Button></div>
          </div>
          <div className="partners-count"><strong>{String(brands.length).padStart(2, "0")}</strong><span>Road-aligned<br />collaborators</span></div>
        </div>
      </section>

      <section className="partners-marquee" aria-label="Partnership principles"><div><span>Shared vision</span><i>◆</i><span>Authentic experiences</span><i>◆</i><span>Rider-first thinking</span><i>◆</i><span>Long-term bonds</span><i>◆</i><span>Shared vision</span></div></section>

      <section className="mx-auto max-w-6xl px-4 py-20 lg:py-28" id="partner-grid">
        <div className="partners-section-heading">
          <div><p className="partners-label"><Sparkles className="h-4 w-4" /> The collaboration roster</p><h2 className="mt-4 font-display text-4xl text-[#e8d9c9] sm:text-6xl">Brands riding beside us.</h2></div>
          <p>Each collaboration is managed by the ROR team and grounded in a connection that makes sense for riders, roads and the wider community.</p>
        </div>

        {brands.length ? <div className="partners-grid">{brands.map((brand, index) => <PartnerCard brand={brand} index={index} key={brand._id} />)}</div> : <div className="partners-empty rebel-frame"><Handshake className="h-10 w-10" /><h3>New alliances are taking shape.</h3><p>Our command center will publish verified brand collaborations here.</p><Button asChild variant="outline"><Link href="/contact">Start a conversation</Link></Button></div>}
      </section>

      <section className="partners-bond-section">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:py-28">
          <div className="max-w-3xl"><p className="partners-label"><HeartHandshake className="h-4 w-4" /> Why the bond matters</p><h2 className="mt-4 font-display text-4xl text-[#e8d9c9] sm:text-6xl">Common ground before commercial ground.</h2><p className="mt-6 max-w-2xl leading-8 text-muted-foreground">We seek partners who understand that credibility is earned on the road. The right collaboration respects the rider, strengthens the experience and creates something useful for the community.</p></div>
          <div className="partners-ground-grid">{sharedGround.map(({ icon: Icon, title, text }, index) => <article key={title}><span>0{index + 1}</span><Icon className="h-7 w-7" /><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 lg:py-28">
        <div className="partners-cta rebel-frame"><div className="partners-cta-ring" aria-hidden="true" /><div className="relative z-10"><p className="partners-label"><Bike className="h-4 w-4" /> Build something riders remember</p><h2 className="mt-4 max-w-3xl font-display text-4xl text-white sm:text-6xl">Your brand. Our roads.<br /><span>One meaningful story.</span></h2><p className="mt-5 max-w-xl leading-7 text-[#b7a398]">Tell us what your brand stands for. We&apos;ll explore whether our communities and ambitions belong on the same road.</p><Button asChild size="lg" className="mt-8"><Link href="/contact">Propose a collaboration <ArrowUpRight className="h-4 w-4" /></Link></Button></div><Handshake className="partners-cta-icon" aria-hidden="true" /></div>
      </section>

      <SiteFooter />
    </main>
  );
}

function PartnerCard({ brand, index }: { brand: ContentItem; index: number }) {
  const image = brand.images?.[0] ?? brand.image;
  return (
    <article className="partner-card">
      <div className="partner-card-media">
        {image ? <Image src={image.url} alt={`${brand.title} brand partnership`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /> : <div className="partner-card-placeholder"><Handshake className="h-14 w-14" /><span>Partner identity</span></div>}
        <div className="partner-card-shade" />
        <span className="partner-card-index">{String(index + 1).padStart(2, "0")}</span>
        {brand.collaborationSince ? <span className="partner-card-since">Together since {brand.collaborationSince}</span> : null}
      </div>
      <div className="partner-card-body">
        <p className="partner-card-category">{brand.category || "Community partner"}</p>
        <h3>{brand.title}</h3>
        {brand.description ? <p className="partner-card-description">{brand.description}</p> : null}
        <div className="partner-card-bond"><HeartHandshake className="h-5 w-5" /><div><strong>The bond</strong><p>{brand.partnershipBond || "Connected by a shared commitment to authentic road experiences, responsible riding and stronger communities."}</p></div></div>
        {safeWebsite(brand.websiteUrl) ? <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" className="partner-site-link"><span>Visit official website</span><ArrowUpRight className="h-4 w-4" /></a> : <span className="partner-site-unavailable">Website link coming soon</span>}
      </div>
    </article>
  );
}

function safeWebsite(value?: string) {
  if (!value) return false;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}
