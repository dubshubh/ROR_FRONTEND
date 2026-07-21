"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Bike, CalendarDays, Handshake, Mail, MapPin, Send, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiErrorMessage } from "@/services/api";
import { submitPartnerEnquiry } from "@/services/partner.service";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function sendPartnerEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const brandName = String(form.get("brandName") ?? "").trim();
    const input = {
      brandName,
      contactName: String(form.get("contactName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      website: String(form.get("website") ?? "").trim(),
      category: String(form.get("category") ?? "").trim(),
      message: String(form.get("message") ?? "").trim()
    };
    const lines = [
      `Brand / company: ${brandName}`,
      `Contact person: ${input.contactName}`,
      `Email: ${input.email}`,
      `Phone: ${input.phone}`,
      `Website / social: ${input.website || "Not provided"}`,
      `Partnership type: ${input.category}`,
      "",
      "Proposal:",
      input.message
    ];
    try {
      setIsSubmitting(true);
      await submitPartnerEnquiry(input);
      toast.success("Enquiry saved. Opening your email app...");
      formElement.reset();
      window.location.href = `mailto:support@rebelsonroads.com?subject=${encodeURIComponent(`Partnership enquiry - ${brandName}`)}&body=${encodeURIComponent(lines.join("\n"))}`;
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b-2 border-red-600 bg-[#0a0a0a]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="font-mono-label text-sm uppercase tracking-[0.25em] text-[#d91b1b]">Contact</p>
          <h1 className="mt-3 font-display text-4xl text-[#e8d9c9] sm:text-5xl">Reach the crew</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Connect with Rebels on Roads for ride participation, membership, safety initiatives, event collaborations, or brand partnerships.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-red-900 bg-[#0f0f0f]">
          <CardHeader>
            <CardTitle className="text-[#e8d9c9]">Get in touch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#d91b1b]" />
              <span>support@rebelsonroads.com</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-[#d91b1b]" />
              <span>Dehradun, Uttarakhand</span>
            </div>
            <p className="leading-7">
              Whether you are a first-time rider, an experienced tourer, or an organization with a meaningful idea, we would be glad to hear from you.
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-900 bg-[#0f0f0f]">
          <CardHeader>
            <CardTitle className="text-[#e8d9c9]">Start your journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">
              Ready to ride with the crew? Register to join the next planned run and start your journey with Rebels on Roads.
            </p>
            <Button asChild className="w-full">
              <Link href="/join-group">
                Join group
                <Send className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          <ContactReason icon={Bike} title="Ride with us" text="Ask about membership, upcoming rides, eligibility, and group riding expectations." />
          <ContactReason icon={CalendarDays} title="Events & initiatives" text="Connect for awareness rides, charity initiatives, community events, and collaborations." />
          <ContactReason icon={ShieldCheck} title="Safety & support" text="Share a road-safety idea, responsible-riding initiative, or a question for the crew." />
        </div>
      </section>

      <section id="partner" className="scroll-mt-24 border-y border-red-900 bg-[#080808]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 max-w-2xl">
            <div className="flex items-center gap-2 text-[#d91b1b]"><Handshake className="h-5 w-5" /><p className="font-mono-label text-sm uppercase tracking-[0.25em]">Partner with us</p></div>
            <h2 className="mt-3 font-display text-3xl text-[#e8d9c9] sm:text-4xl">Tell us about your brand</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Complete the details below to prepare an email for our partnership team.</p>
          </div>
          <form className="grid gap-4 border border-red-900 bg-[#0f0f0f] p-5 sm:grid-cols-2 sm:p-7" onSubmit={sendPartnerEnquiry}>
            <label className="grid gap-1 text-sm">Brand or company name<Input name="brandName" required maxLength={120} /></label>
            <label className="grid gap-1 text-sm">Contact person<Input name="contactName" required maxLength={100} /></label>
            <label className="grid gap-1 text-sm">Business email<Input name="email" type="email" required /></label>
            <label className="grid gap-1 text-sm">Phone number<Input name="phone" type="tel" required maxLength={20} /></label>
            <label className="grid gap-1 text-sm">Website or social profile<Input name="website" type="url" placeholder="https://" /></label>
            <label className="grid gap-1 text-sm">Partnership type<Select name="category" required defaultValue=""><option value="" disabled>Select a category</option><option>Riding gear</option><option>Motorcycle accessories</option><option>Hospitality or venue</option><option>Event sponsorship</option><option>Media collaboration</option><option>Other</option></Select></label>
            <label className="grid gap-1 text-sm sm:col-span-2">Partnership proposal<Textarea name="message" required rows={6} maxLength={2000} placeholder="Describe your brand, proposed collaboration, and what you would like to offer." /></label>
            <Button className="sm:col-span-2 sm:justify-self-start" type="submit" disabled={isSubmitting}><Mail className="h-4 w-4" /> {isSubmitting ? "Submitting..." : "Email partnership team"}</Button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function ContactReason({ icon: Icon, title, text }: { icon: typeof Bike; title: string; text: string }) {
  return <article className="rebel-frame border border-red-900 bg-[#0f0f0f] p-5"><Icon className="h-5 w-5 text-[#d91b1b]" /><h2 className="mt-4 font-display text-2xl text-[#e8d9c9]">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>;
}
