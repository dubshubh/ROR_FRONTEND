"use client";

import Link from "next/link";
import { FormEvent, MouseEvent, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Bike, CalendarDays, CheckCircle2, Clock3, Handshake, Mail, MapPin, MessageCircle, Send, ShieldCheck, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiErrorMessage } from "@/services/api";
import { submitPartnerEnquiry } from "@/services/partner.service";
import { OFFICIAL_CONTACT_EMAIL } from "@/config/contact";
import { socialLinks } from "@/config/social-links";

function gmailComposeUrl(subject = "", body = "") {
  const params = new URLSearchParams({ view: "cm", fs: "1", to: OFFICIAL_CONTACT_EMAIL });
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

const contactPaths = [
  { icon: Bike, number: "01", title: "Join the crew", text: "Membership, eligibility and your first road briefing.", href: "/join-group", action: "Apply to ride" },
  { icon: CalendarDays, number: "02", title: "Build an event", text: "Awareness rides, community initiatives and road experiences.", href: gmailComposeUrl("Event collaboration with Rebels on Roads"), action: "Plan with us" },
  { icon: Handshake, number: "03", title: "Partner with ROR", text: "Create an authentic collaboration that riders remember.", href: "#partner", action: "Start proposal" }
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function sendPartnerEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const brandName = String(form.get("brandName") ?? "").trim();
    const input = { brandName, contactName: String(form.get("contactName") ?? "").trim(), email: String(form.get("email") ?? "").trim(), phone: String(form.get("phone") ?? "").trim(), website: String(form.get("website") ?? "").trim(), category: String(form.get("category") ?? "").trim(), message: String(form.get("message") ?? "").trim() };
    const body = [`Brand / company: ${brandName}`, `Contact person: ${input.contactName}`, `Email: ${input.email}`, `Phone: ${input.phone}`, `Website / social: ${input.website || "Not provided"}`, `Partnership type: ${input.category}`, "", "Proposal:", input.message].join("\n");
    try { setIsSubmitting(true); await submitPartnerEnquiry(input); setSubmitted(true); formElement.reset(); toast.success("Partnership enquiry received"); window.location.assign(gmailComposeUrl(`Partnership enquiry - ${brandName}`, body)); } catch (error) { toast.error(apiErrorMessage(error)); } finally { setIsSubmitting(false); }
  }

  function openWebEmail(event: MouseEvent<HTMLElement>) {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="mailto:"]');
    if (!anchor) return;
    event.preventDefault();
    const subject = new URL(anchor.href).searchParams.get("subject") || "Contact Rebels on Roads";
    window.open(gmailComposeUrl(subject), "_blank", "noopener,noreferrer");
  }

  return <main className="contact-page min-h-screen bg-[#070707]" onClick={openWebEmail}><PublicHeader />
    <section className="contact-hero"><div className="contact-radar" aria-hidden="true"><i /><i /><i /><span /></div><div className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:py-28"><p className="contact-label"><Sparkles className="h-4 w-4" /> Open channel · Rebels on Roads</p><h1 className="contact-title mt-6">Let&apos;s make<br /><span>contact.</span></h1><p className="mt-7 max-w-xl text-base leading-8 text-[#aa978c] sm:text-lg">Whether you want to ride, build an experience or bring a meaningful idea to the road—the command center is listening.</p><div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><a href={`mailto:${OFFICIAL_CONTACT_EMAIL}`}>Email the crew <ArrowUpRight className="h-4 w-4" /></a></Button><Button asChild size="lg" variant="outline"><a href="#contact-paths">Choose your route <ArrowDown className="h-4 w-4" /></a></Button></div></div></section>

    <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24" id="contact-paths"><div className="contact-heading"><div><p className="contact-label">Choose your line</p><h2>What brings you to the road?</h2></div><p>Pick the clearest route and your message reaches the right part of the crew.</p></div><div className="contact-path-grid">{contactPaths.map(({ icon: Icon, number, title, text, href, action }) => <Link href={href} className="contact-path" key={title}><span>{number}</span><div className="contact-path-icon"><Icon /></div><h3>{title}</h3><p>{text}</p><strong>{action}<ArrowRight /></strong></Link>)}</div></section>

    <section className="contact-command"><div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[.8fr_1.2fr] lg:items-start lg:py-24"><div className="contact-info"><p className="contact-label"><MessageCircle className="h-4 w-4" /> Direct channel</p><h2>Real people.<br />One official line.</h2><p>Reach the team for rider support, safety initiatives, events and community coordination.</p><a href={`mailto:${OFFICIAL_CONTACT_EMAIL}`} className="contact-email"><Mail /><span><small>Official email</small><strong>{OFFICIAL_CONTACT_EMAIL}</strong></span><ArrowUpRight /></a><div className="contact-facts"><span><MapPin /><strong>Dehradun</strong><small>Uttarakhand, India</small></span><span><Clock3 /><strong>Community-led</strong><small>Replies may take 1–2 days</small></span><span><ShieldCheck /><strong>Verified channel</strong><small>No unofficial payment requests</small></span></div><div className="contact-socials">{socialLinks.map((social) => <a href={social.href} target="_blank" rel="noopener noreferrer" key={social.label}>{social.label}<ArrowUpRight /></a>)}</div></div>

      <div className="contact-partner-card" id="partner"><div className="contact-form-heading"><span><Handshake /></span><div><p>Partnership desk</p><h2>Tell us what you want to build.</h2></div></div>{submitted ? <div className="contact-form-success"><CheckCircle2 /><h3>Proposal logged.</h3><p>Your enquiry is safely stored for the admin team. Your email app has also been opened with a prepared copy.</p><Button type="button" variant="outline" onClick={() => setSubmitted(false)}>Send another proposal</Button></div> : <form onSubmit={sendPartnerEnquiry} className="contact-form"><div className="contact-form-grid"><label>Brand / company<Input name="brandName" required maxLength={120} placeholder="Brand name" /></label><label>Contact person<Input name="contactName" required maxLength={100} placeholder="Your full name" /></label><label>Business email<Input name="email" type="email" required placeholder="you@company.com" /></label><label>Phone number<Input name="phone" type="tel" required maxLength={20} placeholder="Contact number" /></label><label>Website / social<Input name="website" type="url" placeholder="https://" /></label><label>Partnership type<Select name="category" required defaultValue=""><option value="" disabled>Select category</option><option>Riding gear</option><option>Motorcycle accessories</option><option>Hospitality or venue</option><option>Event sponsorship</option><option>Media collaboration</option><option>Other</option></Select></label></div><label>Partnership proposal<Textarea name="message" required rows={6} maxLength={2000} placeholder="Tell us about your brand, the common ground and the experience you want to create." /></label><div className="contact-form-submit"><p><ShieldCheck />Stored securely for the ROR admin team</p><Button type="submit" disabled={isSubmitting}><Send className="h-4 w-4" />{isSubmitting ? "Transmitting…" : "Send proposal"}</Button></div></form>}</div></div></section>
    <SiteFooter />
  </main>;
}

