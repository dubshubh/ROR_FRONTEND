"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, PanelsTopLeft, Users, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { LogoUploader } from "@/components/admin/logo-uploader";
import { CommandCenterEditor } from "@/components/admin/command-center-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { getDashboardStats } from "@/services/rider.service";

export default function DashboardPage() {
  const { data, isLoading, isFetching } = useQuery({ queryKey: ["stats"], queryFn: getDashboardStats });
  const { data: settings } = useSiteSettings();
  const cards = [
    { label: "Total", value: data?.total, icon: Users, note: "registered riders" },
    { label: "Pending", value: data?.pending, icon: Clock, note: "action required" },
    { label: "Approved", value: data?.approved, icon: CheckCircle2, note: "active members" },
    { label: "Rejected", value: data?.rejected, icon: XCircle, note: "archive" }
  ];

  return (
    <AdminShell>
      <div className="motion-page">
      <div className="relative mb-8 border-b-2 border-primary pb-5">
        <div className="absolute left-0 top-0 -z-0 font-display text-8xl text-white/[0.035] sm:text-[10rem]">REBELS</div>
        <div className="relative">
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#ff535b]"><span className="h-px w-8 bg-[#ff535b]" /> Live operations</div>
          <h1 className="font-display text-4xl text-foreground sm:text-7xl">Command Overview</h1>
          <div className="rebel-pulse mt-2 h-2 w-32 bg-primary" />
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Registration review summary and command actions.</p>
        </div>
      </div>
      <div className="motion-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, note }) => (
          <Card key={label} className="rebel-scan border-primary bg-[#201f1f]">
            <CardHeader className="flex flex-row items-center justify-between border-b-0 pb-2">
              <Icon className="h-6 w-6 text-[#ffb3b1]" />
              <CardTitle className="font-mono text-[11px] tracking-[0.14em]">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-display text-5xl text-foreground drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
                {isLoading ? <span className="inline-block h-12 w-20 shimmer" /> : value ?? 0}
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{note}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {isFetching && !isLoading ? (
        <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#ffb3b1]">Syncing command center...</div>
      ) : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Link href="/admin/content" className="admin-action-card group"><span><PanelsTopLeft /><small>Public website</small><strong>Manage user-facing content</strong><p>Publish rides, events, partners, photos and intercity missions.</p></span><ArrowRight /></Link>
        <Link href="/admin/riders" className="admin-action-card group"><span><CalendarDays /><small>Member operations</small><strong>Review rider applications</strong><p>Approve registrations and maintain your active community roster.</p></span><ArrowRight /></Link>
      </div>
      <div className="motion-rise mt-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <CommandCenterEditor values={settings?.commandCenter} />
          <LogoUploader logo={settings?.logo} />
        </div>
      </div>
      </div>
    </AdminShell>
  );
}
