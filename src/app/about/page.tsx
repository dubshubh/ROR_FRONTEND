import Link from "next/link";
import { ArrowRight, Bike, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

const values = [
  { icon: ShieldCheck, title: "Responsible riding", text: "Promoting road safety, discipline, preparedness, and respect on every ride." },
  { icon: Users, title: "Rider brotherhood", text: "Connecting riders from every walk of life through support, unity, and shared adventure." },
  { icon: HeartHandshake, title: "Community impact", text: "Using the strength of the riding community for awareness campaigns, charity, and service." }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden border-b-2 border-red-600 bg-[#080808]">
        <div className="checkered-strip absolute inset-x-0 top-0 h-2 opacity-70" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-24">
          <div className="rebel-frame relative overflow-hidden rounded-3xl border border-red-900 bg-[#111]">
            <img src="/images/param-arora.png" alt="Param Arora, Founder of Rebels on Roads" className="aspect-[2/3] w-full object-cover object-center" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-6 pb-6 pt-24">
              <p className="font-display text-3xl text-[#e8d9c9]">Param Arora</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-[#d91b1b]">Founder · Rebels on Roads</p>
            </div>
          </div>

          <div>
            <p className="font-mono-label text-sm uppercase tracking-[0.25em] text-[#d91b1b]">Meet the founder</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-[#e8d9c9] sm:text-6xl">A community built with purpose.</h1>
            <div className="mt-7 space-y-5 text-base leading-8 text-muted-foreground">
              <p>Param Arora is the Founder of <span className="font-semibold text-[#e8d9c9]">Rebels on Roads</span>, one of Dehradun&apos;s growing motorcycle riding communities dedicated to responsible riding, road safety, adventure touring, and community service.</p>
              <p>Driven by a passion for motorcycles and the open road, Param created Rebels on Roads to bring riders from all walks of life together around a common purpose: building a disciplined, supportive, and socially responsible riding culture. Under his leadership, the community has organized rides, awareness campaigns, charity initiatives, and large-scale motorcycle events across Uttarakhand.</p>
              <p>For Param, motorcycles are also a way to inspire unity, patriotism, and positive social impact. His focus is on creating memorable riding experiences while encouraging safe practices, environmental responsibility, and giving back to society.</p>
              <p>Today, Rebels on Roads continues to grow as a respected riding community, connecting enthusiasts through adventure, brotherhood, and a shared passion for exploring the roads of India.</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/join-group">Join the community <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/contact">Connect with ROR</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-center gap-2 text-[#d91b1b]"><Bike className="h-5 w-5" /><p className="font-mono-label text-sm uppercase tracking-[0.25em]">What drives us</p></div>
        <h2 className="mt-3 max-w-3xl font-display text-3xl text-[#e8d9c9] sm:text-4xl">Adventure with discipline. Brotherhood with impact.</h2>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => <article key={title} className="rebel-frame rounded-2xl border border-red-900 bg-[#0f0f0f] p-6"><Icon className="h-6 w-6 text-[#d91b1b]" /><h3 className="mt-5 font-display text-2xl text-[#e8d9c9]">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p></article>)}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
