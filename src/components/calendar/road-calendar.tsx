"use client";

import Link from "next/link";
import { Bike, CalendarDays, ChevronLeft, ChevronRight, MapPin, MapPinned, Route } from "lucide-react";
import { useMemo, useState } from "react";
import type { ContentItem } from "@/types/content";

type CalendarKind = "event" | "ride" | "intercity";
const kindConfig = {
  event: { label: "Event", icon: CalendarDays, className: "road-calendar-event" },
  ride: { label: "Ride", icon: Bike, className: "road-calendar-ride" },
  intercity: { label: "Intercity", icon: MapPinned, className: "road-calendar-intercity" }
} satisfies Record<CalendarKind, { label: string; icon: typeof Bike; className: string }>;

export function RoadCalendar({ items }: { items: ContentItem[] }) {
  const scheduledItems = useMemo(() => items.filter((item): item is ContentItem & { kind: CalendarKind } => ["event", "ride", "intercity"].includes(item.kind)), [items]);
  const initialDate = useMemo(() => {
    const next = scheduledItems.filter((item) => item.date && new Date(item.date) >= startOfToday()).sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())[0];
    return next?.date ? new Date(next.date) : new Date();
  }, [scheduledItems]);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [filter, setFilter] = useState<"all" | CalendarKind>("all");
  const visibleItems = useMemo(() => filter === "all" ? scheduledItems : scheduledItems.filter((item) => item.kind === filter), [filter, scheduledItems]);
  const itemsByDate = useMemo(() => {
    const map = new Map<string, typeof visibleItems>();
    visibleItems.forEach((item) => { if (item.date) { const key = dateKey(new Date(item.date)); map.set(key, [...(map.get(key) ?? []), item]); } });
    return map;
  }, [visibleItems]);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const orderedItems = useMemo(() => [...visibleItems].sort((a, b) => (a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER) - (b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER)), [visibleItems]);

  return <div className="road-calendar-shell">
    <section className="road-calendar-panel rebel-frame">
      <div className="road-calendar-toolbar"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff535b]">Live road schedule</p><h2 className="mt-2 font-display text-3xl text-[#e8d9c9] sm:text-4xl">{visibleMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2></div><div className="flex items-center gap-2"><button className="road-calendar-nav" type="button" aria-label="Previous month" onClick={() => setVisibleMonth((date) => addMonths(date, -1))}><ChevronLeft className="h-5 w-5" /></button><button className="road-calendar-today" type="button" onClick={() => setVisibleMonth(firstOfMonth(new Date()))}>Today</button><button className="road-calendar-nav" type="button" aria-label="Next month" onClick={() => setVisibleMonth((date) => addMonths(date, 1))}><ChevronRight className="h-5 w-5" /></button></div></div>
      <div className="road-calendar-filters" aria-label="Calendar filters">{(["all", "event", "ride", "intercity"] as const).map((value) => <button type="button" aria-pressed={filter === value} className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)} key={value}>{value === "all" ? <Route className="h-4 w-4" /> : (() => { const Icon = kindConfig[value].icon; return <Icon className="h-4 w-4" />; })()}<span>{value === "all" ? "All missions" : kindConfig[value].label}</span></button>)}</div>
      <div className="road-calendar-weekdays" aria-hidden="true">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="road-calendar-grid">{calendarDays.map((day) => {
        const dayItems = itemsByDate.get(dateKey(day)) ?? [];
        const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
        const isToday = dateKey(day) === dateKey(new Date());
        return <div className={`road-calendar-day ${!isCurrentMonth ? "is-outside" : ""} ${isToday ? "is-today" : ""} ${dayItems.length ? "has-mission" : ""}`} key={dateKey(day)}><span className="road-calendar-date">{day.getDate()}</span><div className="road-calendar-marks">{dayItems.slice(0, 3).map((item) => { const config = kindConfig[item.kind]; const Icon = config.icon; return <Link href={`/calendar/${item._id}`} aria-label={`${config.label}: ${item.title}`} className={`road-calendar-mark ${config.className}`} key={item._id}><Icon className="h-3.5 w-3.5" /><span>{item.title}</span><span className="road-calendar-tooltip" aria-hidden="true"><span className="road-calendar-tooltip-icon"><Icon className="h-4 w-4" /></span><span className="road-calendar-tooltip-copy"><small>{config.label} briefing</small><strong>{item.title}</strong>{item.date ? <em>{new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</em> : null}</span><ChevronRight className="road-calendar-tooltip-arrow" /></span></Link>; })}{dayItems.length > 3 ? <span className="road-calendar-more">+{dayItems.length - 3}</span> : null}</div></div>;
      })}</div>
      <div className="road-calendar-legend">{Object.entries(kindConfig).map(([kind, config]) => { const Icon = config.icon; return <span key={kind}><i className={config.className}><Icon className="h-3.5 w-3.5" /></i>{config.label}</span>; })}</div>
    </section>

    <section className="mt-14"><div className="mb-6 flex flex-col gap-2 border-b border-red-900 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff535b]">Mission board</p><h2 className="mt-2 font-display text-4xl text-[#e8d9c9]">Scheduled road activity</h2></div><p className="font-mono text-xs text-muted-foreground">{orderedItems.length} published</p></div>{orderedItems.length ? <div className="road-mission-list">{orderedItems.map((item) => <MissionCard item={item} key={item._id} />)}</div> : <div className="rebel-frame p-10 text-center"><CalendarDays className="mx-auto h-8 w-8 text-[#ff535b]" /><h3 className="mt-4 font-display text-3xl">No missions scheduled</h3><p className="mt-2 text-muted-foreground">Change the filter or check back after the command center publishes an update.</p></div>}</section>
  </div>;
}

function MissionCard({ item }: { item: ContentItem & { kind: CalendarKind } }) {
  const config = kindConfig[item.kind]; const Icon = config.icon;
  const location = item.kind === "event" ? item.location : [item.startLocation, item.destination].filter(Boolean).join(" → ");
  return <Link href={`/calendar/${item._id}`} className="road-mission-card group"><div className={`road-mission-icon ${config.className}`}><Icon className="h-6 w-6" /></div><div className="min-w-0 grow"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff535b]">{config.label}</span><span className="road-mission-status">{item.status}</span></div><h3 className="mt-2 font-display text-2xl text-[#e8d9c9] group-hover:text-white">{item.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>{location ? <p className="mt-3 flex items-center gap-2 font-mono text-xs text-[#d8c9ba]"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#ff535b]" />{location}</p> : null}</div><div className="road-mission-date"><strong>{item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit" }) : "—"}</strong><span>{item.date ? new Date(item.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "TBA"}</span><ArrowIcon /></div></Link>;
}

function ArrowIcon() { return <ChevronRight className="mt-3 h-5 w-5 text-[#ff535b] transition-transform group-hover:translate-x-1" />; }
function firstOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function startOfToday() { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function buildCalendarDays(month: Date) { const first = firstOfMonth(month); const mondayOffset = (first.getDay() + 6) % 7; const start = new Date(first); start.setDate(first.getDate() - mondayOffset); return Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; }); }
