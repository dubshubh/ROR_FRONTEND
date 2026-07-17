import Link from "next/link";
import { Mail, MapPin, PhoneCall, Send } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b-2 border-red-600 bg-[#0a0a0a]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="font-mono-label text-sm uppercase tracking-[0.25em] text-[#d91b1b]">Contact</p>
          <h1 className="mt-3 font-display text-4xl text-[#e8d9c9] sm:text-5xl">Reach the crew</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Connect for ride updates, event participation, or membership related questions. The team will get back to you quickly.
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
              <PhoneCall className="h-4 w-4 text-[#d91b1b]" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-[#d91b1b]" />
              <span>Dehradun • Pune • Goa ride circuit</span>
            </div>
            <p className="leading-7">
              Whether you are a first-time rider or a seasoned road explorer, the team is happy to guide you into the next event.
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

      <SiteFooter />
    </main>
  );
}
