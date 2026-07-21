"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Radio, Send, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/services/api";
import { getEmailLogs, sendAdminEmail, type EmailAudience, type EmailCategory } from "@/services/email.service";

const presets: Array<{ label: string; category: EmailCategory; audience: EmailAudience; subject: string; message: string }> = [
  { label: "Ride briefing", category: "ride-update", audience: "approvedRiders", subject: "Upcoming ride briefing — Rebels on Roads", message: "The next Rebels on Roads ride is being prepared.\n\nPlease review the assembly time, meeting point, route and safety instructions shared by the road captain. Arrive fuelled and ready before the briefing begins." },
  { label: "Collaboration proposal", category: "brand-collaboration", audience: "brands", subject: "Let’s collaborate with Rebels on Roads", message: "We would love to explore a meaningful collaboration between your brand and Rebels on Roads.\n\nOur community focuses on responsible riding, curated road experiences and authentic engagement. Reply to this email so we can discuss the right partnership format." },
  { label: "Thank a partner", category: "brand-thanks", audience: "brands", subject: "Thank you for supporting Rebels on Roads", message: "Thank you for collaborating with Rebels on Roads.\n\nYour support helped us create a stronger experience for the riding community. We appreciate the partnership and look forward to building more meaningful road stories together." },
  { label: "Community announcement", category: "announcement", audience: "all", subject: "Rebels on Roads community update", message: "We have an important community update to share.\n\nPlease read the information below and contact rebelsonroads@gmail.com if you need clarification." }
];

export default function EmailCenterPage() {
  const queryClient = useQueryClient();
  const [audience, setAudience] = useState<EmailAudience>("approvedRiders");
  const [category, setCategory] = useState<EmailCategory>("ride-update");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [customRecipients, setCustomRecipients] = useState("");
  const history = useQuery({ queryKey: ["email-logs"], queryFn: getEmailLogs });
  const sendMutation = useMutation({
    mutationFn: sendAdminEmail,
    onSuccess: (result) => { toast.success(result.status === "skipped" ? "Email logged; Brevo delivery is disabled" : `Sent ${result.sentCount} of ${result.recipientCount} emails`); void queryClient.invalidateQueries({ queryKey: ["email-logs"] }); },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  function applyPreset(preset: (typeof presets)[number]) { setAudience(preset.audience); setCategory(preset.category); setSubject(preset.subject); setMessage(preset.message); }
  function submit() {
    const recipients = customRecipients.split(/[\s,;]+/).map((value) => value.trim()).filter(Boolean);
    sendMutation.mutate({ audience, category, subject: subject.trim(), message: message.trim(), customRecipients: recipients });
  }

  return <AdminShell><div className="motion-page">
    <div className="mb-8 flex flex-col gap-4 border-b-2 border-primary pb-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#ff535b]"><Radio className="h-4 w-4" />Brevo communication desk</div><h1 className="mt-3 font-display text-4xl text-[#ffb3b1] sm:text-6xl">Email Center</h1><p className="mt-2 max-w-2xl text-muted-foreground">Send approved ride updates, partnership messages and community announcements from one controlled channel.</p></div><div className="rebel-frame flex items-center gap-3 bg-[#101010] px-4 py-3"><Mail className="h-5 w-5 text-[#ff535b]" /><div><p className="font-mono text-[10px] uppercase text-muted-foreground">Official reply address</p><p className="text-sm text-[#e8d9c9]">rebelsonroads@gmail.com</p></div></div></div>

    <div className="grid gap-6 xl:grid-cols-[1fr_0.78fr]">
      <Card className="rebel-scan p-5 sm:p-7"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#ff535b]" /><h2 className="font-display text-2xl">Compose transmission</h2></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm">Audience<Select value={audience} onChange={(event) => setAudience(event.target.value as EmailAudience)}><option value="approvedRiders">Approved riders</option><option value="brands">Brand contacts</option><option value="all">Riders and brands</option><option value="custom">Custom recipients</option></Select></label><label className="grid gap-2 text-sm">Message category<Select value={category} onChange={(event) => setCategory(event.target.value as EmailCategory)}><option value="ride-update">Ride update</option><option value="brand-collaboration">Brand collaboration</option><option value="brand-thanks">Brand thanks</option><option value="announcement">Announcement</option><option value="custom">Custom</option></Select></label></div>
        {audience === "custom" ? <label className="mt-4 grid gap-2 text-sm">Recipient emails<Input value={customRecipients} onChange={(event) => setCustomRecipients(event.target.value)} placeholder="one@example.com, two@example.com" /></label> : null}
        <label className="mt-4 grid gap-2 text-sm">Subject<Input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} placeholder="Clear, specific email subject" /></label><label className="mt-4 grid gap-2 text-sm">Message<Textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={10} maxLength={5000} placeholder="Write the message recipients should receive..." /></label><div className="mt-5 flex flex-col gap-3 border-t border-[#5b403f] pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Recipients never see other recipients. Sends are logged and audited.</p><Button onClick={submit} disabled={sendMutation.isPending || subject.trim().length < 3 || message.trim().length < 10}><Send className="h-4 w-4" />{sendMutation.isPending ? "Transmitting..." : "Send email"}</Button></div>
      </Card>

      <div className="grid content-start gap-6"><Card className="p-5"><h2 className="font-display text-2xl">Quick missions</h2><p className="mt-2 text-sm text-muted-foreground">Start with a production-ready template, then customize it.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{presets.map((preset) => <button type="button" onClick={() => applyPreset(preset)} className="rebel-hover flex items-center justify-between border border-[#5b403f] p-4 text-left" key={preset.label}><span><span className="block font-display text-lg text-[#e8d9c9]">{preset.label}</span><span className="mt-1 block font-mono text-[10px] uppercase text-muted-foreground">{preset.audience.replace(/([A-Z])/g, " $1")}</span></span><Sparkles className="h-4 w-4 text-[#ff535b]" /></button>)}</div></Card>
        <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-[#5b403f] p-5"><div><h2 className="font-display text-2xl">Recent transmissions</h2><p className="text-xs text-muted-foreground">Automations and admin sends</p></div><Users className="h-5 w-5 text-[#ff535b]" /></div><div className="divide-y divide-[#3f2626]">{history.isLoading ? <div className="h-40 shimmer" /> : history.data?.logs.length ? history.data.logs.map((log) => <div className="p-4" key={log._id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#e8d9c9]">{log.subject}</p><p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{log.category} · {new Date(log.createdAt).toLocaleString("en-IN")}</p></div><span className={`border px-2 py-1 font-mono text-[9px] uppercase ${log.status === "sent" ? "border-emerald-400 text-emerald-300" : log.status === "failed" ? "border-red-600 text-red-600" : "border-amber-400 text-amber-300"}`}>{log.status}</span></div><p className="mt-2 text-xs text-muted-foreground">{log.sentCount} sent · {log.failedCount} failed · {log.recipientCount} recipients</p></div>) : <div className="p-8 text-center text-sm text-muted-foreground">No email activity yet.</div>}</div></Card>
      </div>
    </div>
  </div></AdminShell>;
}
