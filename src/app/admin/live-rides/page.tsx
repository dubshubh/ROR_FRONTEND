"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bike,
  Check,
  Copy,
  Crown,
  MapPin,
  MessageSquare,
  Plus,
  QrCode,
  Radio,
  Share2,
  Trash2,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { RideQrDialog } from "@/components/live-ride/ride-qr-dialog";
import { apiErrorMessage } from "@/services/api";
import { createLiveRide, deleteLiveRide, getLiveRidesAdmin } from "@/services/live-ride.service";
import type { LiveRide } from "@/types/live-ride";

const DEFAULT_PRESET_MESSAGES = [
  "🛑 Regroup at next fuel station / stop",
  "➡️ Take right fork / bypass ahead",
  "⬅️ Take left fork / service road ahead",
  "⚠️ Road hazard / bad asphalt ahead: reduce speed",
  "⏸️ Quick 5-min hydration break",
  "🚀 Formation moving out in 2 minutes",
  "🚨 Pull over on left shoulder immediately"
];

export default function AdminLiveRidesPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LiveRide | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<LiveRide | null>(null);

  // Creation form state
  const [autoJoinLead, setAutoJoinLead] = useState(true);
  const [quickMessages, setQuickMessages] = useState<string[]>(DEFAULT_PRESET_MESSAGES);
  const [newMsgText, setNewMsgText] = useState("");

  const { data: rides = [], isLoading } = useQuery({
    queryKey: ["admin-live-rides"],
    queryFn: getLiveRidesAdmin,
    refetchInterval: 5000 // Refresh active ride participant counts
  });

  const createMutation = useMutation({
    mutationFn: createLiveRide,
    onSuccess: (newRide) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-live-rides"] });
      setIsCreating(false);
      setQuickMessages(DEFAULT_PRESET_MESSAGES);
      setNewMsgText("");
      toast.success(`Live Ride "${newRide.title}" created with code ${newRide.code}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLiveRide(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-live-rides"] });
      setDeleteTarget(null);
      toast.success("Live ride session deleted");
    },
    onError: (err) => toast.error(apiErrorMessage(err))
  });

  function handleCopyLink(code: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/live-ride/${code}`;
    void navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedCode(code);
      toast.success("Rider invite link copied to clipboard!");
      setTimeout(() => setCopiedCode(null), 2500);
    });
  }

  function handleAddQuickMessage() {
    const trimmed = newMsgText.trim();
    if (!trimmed) return;
    if (quickMessages.includes(trimmed)) {
      toast.error("Message already exists in preset list");
      return;
    }
    setQuickMessages((prev) => [...prev, trimmed]);
    setNewMsgText("");
  }

  function handleRemoveQuickMessage(index: number) {
    setQuickMessages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCreateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      title: String(form.get("title") ?? "").trim(),
      startLocation: String(form.get("startLocation") ?? "").trim(),
      destination: String(form.get("destination") ?? "").trim(),
      code: String(form.get("code") ?? "").trim() || undefined,
      quickMessages,
      autoJoinLead,
      leadRiderName: autoJoinLead ? String(form.get("leadRiderName") ?? "").trim() || "Road Captain (Leader)" : undefined,
      leadBikeModel: autoJoinLead ? String(form.get("leadBikeModel") ?? "").trim() || "Lead Motorcycle" : undefined,
      leadBikeNumber: autoJoinLead ? String(form.get("leadBikeNumber") ?? "").trim() : undefined
    });
  }

  return (
    <AdminShell>
      <div className="motion-page">
        {/* Header Bar */}
        <div className="mb-7 flex flex-col gap-4 border-b border-[#67272a] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#ff535b]">
              <Radio className="h-3 w-3 animate-pulse" /> Real-Time Fleet Radar
            </div>
            <h1 className="font-display text-4xl text-[#ffdad8] sm:text-6xl">Live Ride Tracking</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Create live tracking sessions, assign Marshals as volunteer direction guides, broadcast 1-tap tactical alerts, and monitor the entire formation on the dark radar.
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="sm:shrink-0 w-full sm:w-auto h-11 shadow-lg shadow-red-950/40">
            <Plus className="h-4 w-4 mr-2" /> Create Live Ride
          </Button>
        </div>

        {/* Tactical Command & Messaging Info Banner */}
        <div className="mb-6 p-4 rounded-xl border border-[#ff535b]/30 bg-gradient-to-r from-[#201012] via-[#161011] to-[#120f0f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#ff535b]/15 border border-[#ff535b]/30 flex items-center justify-center shrink-0">
              <Radio className="h-4 w-4 text-[#ff535b] animate-pulse" />
            </div>
            <div>
              <span className="text-[#ffdad8] font-bold block text-sm">Real-Time Tactical Operations Desk</span>
              <span className="text-[#a8958a] block text-[11px] mt-0.5">
                Click <strong>&quot;Open Tactical Map&quot;</strong> on any active ride to enter the live Leaflet radar, dispatch 1-tap sound &amp; priority broadcasts, and manage volunteer Marshals.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-md bg-[#241717] border border-[#442b2a] text-[10px] text-[#ffdad8] font-bold">
              {rides.length} {rides.length === 1 ? "Session" : "Sessions"} Available
            </span>
          </div>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="h-52 shimmer rounded-xl" />
            <div className="h-52 shimmer rounded-xl" />
          </div>
        ) : !rides.length ? (
          <Card className="p-12 text-center border-dashed border-[#5b403f] bg-[#121010] rounded-xl">
            <Radio className="h-12 w-12 text-[#ff535b] mx-auto mb-3 opacity-60 animate-pulse" />
            <h3 className="font-display text-2xl text-[#ffdad8]">No Live Rides Active</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              Start a new session before briefing the squad. Riders can join from their mobile browsers without downloading any app.
            </p>
            <Button onClick={() => setIsCreating(true)} className="mt-6" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Start First Ride Session
            </Button>
          </Card>
        ) : (
          <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {rides.map((ride) => {
              const isActive = ride.status === "active";
              const isPaused = ride.status === "paused";

              return (
                <Card
                  key={ride._id}
                  className={`p-5 flex flex-col justify-between border rounded-xl transition-all duration-200 overflow-hidden ${
                    isActive
                      ? "border-[#ff535b]/50 bg-[#161111] hover:border-[#ff535b] shadow-[0_4px_25px_rgba(255,83,91,0.12)]"
                      : "border-[#352323] bg-[#121010] hover:border-[#4d2f2f]"
                  }`}
                >
                  <div>
                    {/* Top Row: Status Badge, Code with 1-Click Copy, and Delete Action */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase font-semibold px-2.5 py-1 rounded-md border ${
                            isActive
                              ? "border-emerald-500/60 text-emerald-400 bg-emerald-500/15"
                              : isPaused
                              ? "border-amber-500/60 text-amber-400 bg-amber-500/15"
                              : "border-zinc-700 text-zinc-400 bg-zinc-800/40"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-emerald-400 animate-pulse" : isPaused ? "bg-amber-400" : "bg-zinc-400"
                            }`}
                          />
                          {ride.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(ride.code)}
                          title="Click to copy rider invite link"
                          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#ffdad8] bg-[#221717] hover:bg-[#2e1d1d] px-2.5 py-1 rounded-md border border-[#442b2a] transition cursor-pointer group"
                        >
                          <span className="text-[#a38a88] group-hover:text-[#ffdad8] text-[10px]">CODE:</span>
                          <span className="font-bold text-[#ff535b]">{ride.code}</span>
                          {copiedCode === ride.code ? (
                            <Check className="h-3 w-3 text-emerald-400 ml-0.5" />
                          ) : (
                            <Copy className="h-3 w-3 text-[#796861] group-hover:text-[#ffdad8] ml-0.5" />
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/50 transition cursor-pointer shrink-0"
                        title="Delete Session"
                        onClick={() => setDeleteTarget(ride)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Mission Title */}
                    <h2 className="font-display text-2xl text-white tracking-wide mb-2 line-clamp-1">
                      {ride.title}
                    </h2>

                    {/* Route & Riders Telemetry */}
                    <div className="text-xs font-mono text-muted-foreground space-y-2 mb-4">
                      {ride.startLocation || ride.destination ? (
                        <div className="flex items-start gap-2 text-[#cbb8ad] bg-[#1a1414] p-2.5 rounded-lg border border-[#2f2020]">
                          <MapPin className="h-3.5 w-3.5 text-[#ff535b] shrink-0 mt-0.5" />
                          <span className="line-clamp-1 text-[11px]">
                            <strong className="text-white font-normal">{ride.startLocation || "Start"}</strong>
                            <span className="text-[#ff535b] mx-1.5 font-bold">→</span>
                            <strong className="text-white font-normal">{ride.destination || "Destination"}</strong>
                          </span>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between text-[11px] px-1">
                        <span className="flex items-center gap-1.5 text-[#a8958a]">
                          <Users className="h-3.5 w-3.5 text-[#ff535b] shrink-0" />
                          <span>
                            <strong className="text-emerald-400 font-bold">{ride.activeParticipants ?? 0}</strong> active now
                          </span>
                        </span>
                        <span className="text-[#7e6d65]">
                          ({ride.totalParticipants ?? 0} joined)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3.5 border-t border-[#352323] space-y-2">
                    {/* Primary CTA: Open Tactical Radar */}
                    <Button asChild className="w-full font-display text-sm tracking-wide uppercase h-10 bg-primary hover:bg-primary/90 shadow-md cursor-pointer">
                      <Link href={`/admin/live-rides/${ride._id}`}>
                        <Radio className="h-3.5 w-3.5 mr-2 animate-pulse text-[#ffd700]" /> Open Tactical Map
                      </Link>
                    </Button>

                    {/* Secondary Actions Grid: 3 equal, perfectly contained columns */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-mono text-[11px] px-2 h-8 border-[#442b2a] text-[#ffdad8] hover:bg-[#251818] hover:border-[#ff535b]/50 cursor-pointer flex items-center justify-center gap-1"
                        title="View & Download QR Code Flyer"
                        onClick={() => setQrTarget(ride)}
                      >
                        <QrCode className="h-3.5 w-3.5 text-[#ff535b] shrink-0" />
                        <span className="truncate">QR Flyer</span>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="font-mono text-[11px] px-2 h-8 border-[#442b2a] text-[#ffdad8] hover:bg-[#251818] hover:border-[#ff535b]/50 flex items-center justify-center gap-1"
                        title="Open Rider HUD cockpit in new tab to test live GPS"
                      >
                        <a href={`/live-ride/${ride.code}`} target="_blank" rel="noopener noreferrer">
                          <Bike className="h-3.5 w-3.5 text-[#ff535b] shrink-0" />
                          <span className="truncate">HUD</span>
                        </a>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="font-mono text-[11px] px-2 h-8 border-[#442b2a] text-[#ffdad8] hover:bg-[#251818] hover:border-[#ff535b]/50 cursor-pointer flex items-center justify-center gap-1"
                        title="Copy Rider Invite Link"
                        onClick={() => handleCopyLink(ride.code)}
                      >
                        {copiedCode === ride.code ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span className="text-emerald-400 font-bold truncate">Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3.5 w-3.5 text-[#ff535b] shrink-0" />
                            <span className="truncate">Share</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Ride Modal Dialog */}
        {isCreating ? (
          <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex items-start sm:items-center justify-center">
            {/* Backdrop click handler */}
            <div
              className="fixed inset-0"
              onClick={() => !createMutation.isPending && setIsCreating(false)}
              aria-hidden="true"
            />

            <Card className="relative z-10 w-full max-w-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-[#141010] border border-[#552e2e] shadow-2xl rounded-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
              {/* Pinned Modal Header */}
              <div className="shrink-0 px-5 py-4 sm:px-6 sm:py-5 border-b border-[#3e2424] bg-[#191212] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#ff535b] mb-1">
                    <Radio className="h-3 w-3 animate-pulse" /> Mission Launchpad
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
                    Create Live Ride Session
                  </h2>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    Launch radar, configure Lead Captain, and setup 1-Tap broadcast presets
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  disabled={createMutation.isPending}
                  className="text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form id="create-ride-form" onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                {/* Section 1: Route & Title */}
                <div className="space-y-3.5">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[#ffdad8] font-bold flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#ff535b]" /> Mission Route & Details
                  </h3>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#cfbeb6] mb-1">
                      Ride Mission Title *
                    </label>
                    <Input
                      name="title"
                      required
                      placeholder="e.g. Sunrise Ride to Mussoorie"
                      className="bg-[#1e1b1b] border-[#442b2a] text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#cfbeb6] mb-1">
                        Start Location
                      </label>
                      <Input
                        name="startLocation"
                        placeholder="e.g. Clock Tower, Dehradun"
                        className="bg-[#1e1b1b] border-[#442b2a] text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#cfbeb6] mb-1">
                        Destination
                      </label>
                      <Input
                        name="destination"
                        placeholder="e.g. Mall Road, Mussoorie"
                        className="bg-[#1e1b1b] border-[#442b2a] text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#cfbeb6] mb-1">
                      Custom Ride Code (Optional)
                    </label>
                    <Input
                      name="code"
                      placeholder="Leave empty for auto-generated code"
                      className="bg-[#1e1b1b] border-[#442b2a] uppercase font-mono text-white"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">
                      Example: ROR-DAWN. Riders will join via rebelsonroads.com/live-ride/CODE or scan QR.
                    </p>
                  </div>
                </div>

                {/* Section 2: Admin Lead Auto-Join */}
                <div className="p-4 bg-[#1a1212] border border-[#4d2a2a] rounded-xl space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#ffdad8]">
                      <Crown className="h-4 w-4 text-[#ffd700]" />
                      <span>Auto-Join as Session Leader</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={autoJoinLead}
                      onChange={(e) => setAutoJoinLead(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#ff535b] cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-[#bca299] leading-relaxed">
                    Automatically initializes you as the Gold Star Lead Captain on the radar. You can stream your phone&apos;s GPS live during the ride.
                  </p>

                  {autoJoinLead ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] uppercase text-[#cfbeb6] mb-1">Leader Name</label>
                        <Input
                          name="leadRiderName"
                          defaultValue="Road Captain (Leader)"
                          placeholder="e.g. Vikram Singh"
                          className="h-9 text-xs bg-[#110d0d] border-[#442b2a] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-[#cfbeb6] mb-1">Lead Motorcycle</label>
                        <Input
                          name="leadBikeModel"
                          defaultValue="Lead Motorcycle"
                          placeholder="e.g. Continental GT 650"
                          className="h-9 text-xs bg-[#110d0d] border-[#442b2a] text-white"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Section 3: Predefined 1-Tap Broadcast Messages */}
                <div className="p-4 bg-[#12161a] border border-[#233d45] rounded-xl space-y-2.5 font-mono">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8ae8ff]">
                    <MessageSquare className="h-4 w-4 text-[#00f0ff]" />
                    <span>Preset 1-Tap Broadcast Messages (for Leader &amp; Marshals)</span>
                  </div>
                  <p className="text-[11px] text-[#8ea7b0] leading-relaxed">
                    These messages appear as instant one-tap buttons on both the Admin Command Desk and volunteer Marshals&apos; phone cockpits.
                  </p>

                  {/* Message Tags */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 py-1">
                    {quickMessages.map((msg, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0d1e24] border border-[#1d434f] text-[11px] text-[#c9eef7]"
                      >
                        <span className="truncate max-w-[260px]">{msg}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuickMessage(idx)}
                          className="text-[#ff535b] hover:text-white shrink-0 font-bold ml-0.5 cursor-pointer"
                          title="Remove message"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Custom Message */}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      placeholder="Add custom 1-tap direction or stop alert..."
                      className="h-9 text-xs bg-[#0b1418] border-[#22444e] text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddQuickMessage();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddQuickMessage}
                      className="h-9 text-xs border-[#22444e] text-[#00f0ff] hover:bg-[#15343d] shrink-0 cursor-pointer"
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              </form>

              {/* Pinned Modal Footer */}
              <div className="shrink-0 px-5 py-3.5 sm:px-6 sm:py-4 border-t border-[#3e2424] bg-[#191212] flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  disabled={createMutation.isPending}
                  className="border-[#442b2a] text-[#ffdad8] hover:bg-[#251818] cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="create-ride-form"
                  disabled={createMutation.isPending}
                  className="bg-[#ff535b] hover:bg-[#ff3b44] text-white cursor-pointer font-bold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(255,83,91,0.25)]"
                >
                  {createMutation.isPending ? "Launching..." : "Launch Live Ride"}
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete Live Ride Session?"
          description={
            deleteTarget
              ? `Session "${deleteTarget.title}" (${deleteTarget.code}) and all tracking records will be permanently deleted.`
              : ""
          }
          confirmLabel="Delete Session"
          pending={deleteMutation.isPending}
          onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        />

        {/* Live Formation QR Code & Download Dialog */}
        <RideQrDialog
          open={Boolean(qrTarget)}
          onOpenChange={(open) => !open && setQrTarget(null)}
          rideTitle={qrTarget?.title || ""}
          rideCode={qrTarget?.code || ""}
          startLocation={qrTarget?.startLocation}
          destination={qrTarget?.destination}
        />
      </div>
    </AdminShell>
  );
}
