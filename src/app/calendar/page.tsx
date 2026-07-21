import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { RoadCalendar } from "@/components/calendar/road-calendar";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { loadPublicContent } from "@/lib/public-content";

export const metadata: Metadata = { title: "Road Calendar", description: "Events, rides and intercity schedules from Rebels on Roads in one interactive calendar." };

export default async function CalendarPage() {
  const content = await loadPublicContent();
  const items = [...content.events, ...content.rides, ...content.intercity];
  return <main className="min-h-screen bg-background"><PublicHeader /><section className="relative overflow-hidden border-b-2 border-red-600 bg-[#080808]"><div className="checkered-strip absolute inset-x-0 top-0 h-2 opacity-70" /><div className="absolute right-[-5%] top-[-30%] h-80 w-80 rounded-full bg-red-600/10 blur-3xl" /><div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20"><div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-[#ff535b]"><CalendarDays className="h-4 w-4" />Command center schedule</div><h1 className="mt-3 max-w-4xl font-display text-4xl text-[#e8d9c9] sm:text-6xl">The road calendar</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Every event, chapter ride and intercity mission in one live schedule. Select a marked date or mission to open the complete briefing.</p></div></section><section className="mx-auto max-w-6xl px-4 py-10 sm:py-16"><RoadCalendar items={items} /></section><SiteFooter /></main>;
}
