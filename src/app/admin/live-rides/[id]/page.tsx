"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellRing,
  Bike,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  MessageSquare,
  Pause,
  Play,
  QrCode,
  Radio,
  Search,
  Send,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  UserMinus,
  Users,
  Volume2,
  X
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { RideQrDialog } from "@/components/live-ride/ride-qr-dialog";
import { useLiveTracking } from "@/hooks/use-live-tracking";
import {
  dispatchBrowserNotification,
  getNotificationPermissionStatus,
  isIOS,
  isStandalonePWA,
  playTacticalAlertChime,
  registerServiceWorker,
  requestBrowserNotificationPermission,
  type NotificationPermissionStatus
} from "@/lib/notifications";
import { apiErrorMessage } from "@/services/api";
import {
  ejectParticipant,
  getLiveRideAdmin,
  sendAdminBroadcastMessage,
  updateLiveRideStatus,
  updateParticipantRole
} from "@/services/live-ride.service";
import type { ParticipantRole } from "@/types/live-ride";

// Dynamic import of Leaflet tactical map
const TacticalMap = dynamic(
  () => import("@/components/live-ride/tactical-map").then((mod) => mod.TacticalMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[480px] bg-background flex items-center justify-center border border-border rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Loading Tactical Radar Grid...
          </span>
        </div>
      </div>
    )
  }
);

function parseQuickMessage(msg: string) {
  let icon = "💬";
  let shortLabel = msg;
  let priority: "normal" | "direction" | "urgent" = "normal";

  if (msg.includes("🚨") || /pull over|shoulder|emergency/i.test(msg)) {
    icon = "🚨";
    priority = "urgent";
    shortLabel = "Pull Over";
  } else if (msg.includes("⚠️") || /hazard|asphalt|slow down/i.test(msg)) {
    icon = "⚠️";
    priority = "urgent";
    shortLabel = "Hazard Ahead";
  } else if (msg.includes("➡️") || /right fork|turn right/i.test(msg)) {
    icon = "➡️";
    priority = "direction";
    shortLabel = "Right Fork";
  } else if (msg.includes("⬅️") || /left fork|turn left/i.test(msg)) {
    icon = "⬅️";
    priority = "direction";
    shortLabel = "Left Fork";
  } else if (msg.includes("🛑") || /fuel|petrol|regroup/i.test(msg)) {
    icon = "⛽";
    priority = "normal";
    shortLabel = "Fuel Regroup";
  } else if (msg.includes("⏸️") || /break|hydration|water/i.test(msg)) {
    icon = "⏸️";
    priority = "normal";
    shortLabel = "5-Min Break";
  } else if (msg.includes("🚀") || /moving out|move out|roll out/i.test(msg)) {
    icon = "🚀";
    priority = "normal";
    shortLabel = "Moving Out";
  } else {
    const clean = msg.replace(/^[^\w\s]+/, "").trim();
    shortLabel = clean.length > 14 ? clean.slice(0, 14) + "..." : clean;
  }

  return { icon, shortLabel, fullText: msg, priority };
}

export default function AdminLiveRideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [ejectTarget, setEjectTarget] = useState<{ id: string; name: string } | null>(null);
  const [directMessageTarget, setDirectMessageTarget] = useState<{ id: string; name: string } | null>(null);
  const [customDirectMessageText, setCustomDirectMessageText] = useState("");
  const [directMessagePriority, setDirectMessagePriority] = useState<"normal" | "urgent" | "direction">("urgent");
  const [confirmEndRide, setConfirmEndRide] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<"map" | "roster" | "broadcast" | "controls">("map");
  const [rightPanelTab, setRightPanelTab] = useState<"roster" | "broadcast" | "controls">("roster");
  const [copied, setCopied] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterFilter, setRosterFilter] = useState<"all" | "live" | "offline" | "marshal">("all");

  // Broadcast messaging state
  const [broadcastTargetId, setBroadcastTargetId] = useState<string>("all");
  const [customBroadcastText, setCustomBroadcastText] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState<"normal" | "urgent" | "direction">("normal");
  const [showQuickDispatches, setShowQuickDispatches] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [notifPermission, setNotifPermission] = useState<NotificationPermissionStatus>("default");
  const [dismissedRadarAlertId, setDismissedRadarAlertId] = useState<string | null>(null);
  const lastSeenMsgTimestampRef = useRef<number>(Date.now());
  const initializedMsgsRef = useRef(false);

  useEffect(() => {
    setNotifPermission(getNotificationPermissionStatus());
    void registerServiceWorker();
  }, []);

  async function handleEnableNotifications() {
    const perm = await requestBrowserNotificationPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      toast.success("Live radar notifications enabled!");
    } else if (perm === "denied") {
      toast.error("Notifications blocked in browser. Please allow them in site settings.");
    } else if (perm === "unsupported") {
      if (isIOS() && !isStandalonePWA()) {
        toast.info("🍎 On iPhone Safari: Add to Home Screen to enable lock-screen alerts. Screen chimes are active!");
      } else {
        toast.info("Tactical audio chimes active for this console.");
      }
    }
  }

  const adminTracking = useLiveTracking();

  // Poll ride state and active locations every 3 seconds
  const { data: ride, isLoading, isError, error } = useQuery({
    queryKey: ["admin-live-ride", id],
    queryFn: () => getLiveRideAdmin(id),
    refetchInterval: 3000
  });

  // Watch incoming messages for live audio chime and push alerts
  useEffect(() => {
    if (!ride?.messages || ride.messages.length === 0) return;

    if (!initializedMsgsRef.current) {
      initializedMsgsRef.current = true;
      const newestTime = Math.max(...ride.messages.map((m) => new Date(m.sentAt).getTime()));
      lastSeenMsgTimestampRef.current = newestTime;
      return;
    }

    const newMessages = ride.messages.filter(
      (m) => new Date(m.sentAt).getTime() > lastSeenMsgTimestampRef.current
    );

    if (newMessages.length > 0) {
      const newestTime = Math.max(...newMessages.map((m) => new Date(m.sentAt).getTime()));
      lastSeenMsgTimestampRef.current = newestTime;

      // Play audio chime and trigger push notification for the newest alert
      const latest = newMessages[newMessages.length - 1];
      playTacticalAlertChime(latest.priority || "normal");

      const rolePrefix =
        latest.senderRole === "lead"
          ? "★ Road Captain"
          : latest.senderRole === "marshal"
          ? "🧭 Marshal"
          : "🏍️ Rider";

      dispatchBrowserNotification({
        title: `${rolePrefix} Alert (${ride.code})`,
        body: latest.targetRiderName
          ? `[Direct to ${latest.targetRiderName}] ${latest.text}`
          : `${latest.senderName}: ${latest.text}`,
        priority: latest.priority || "normal"
      });

      toast.info(`Tactical Alert from ${latest.senderName}: "${latest.text}"`);
    }
  }, [ride?.messages, ride?.code]);

  const ejectMutation = useMutation({
    mutationFn: ({ participantId }: { participantId: string }) => ejectParticipant(id, participantId),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-live-ride", id] });
      setEjectTarget(null);
      toast.success(res.status === "ejected" ? "Rider disconnected and GPS terminated" : "Rider updated");
    },
    onError: (err) => toast.error(apiErrorMessage(err))
  });

  const roleMutation = useMutation({
    mutationFn: ({ participantId, role }: { participantId: string; role: ParticipantRole }) =>
      updateParticipantRole(id, participantId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-live-ride", id] });
      toast.success("Rider role updated");
    },
    onError: (err) => toast.error(apiErrorMessage(err))
  });

  const broadcastMutation = useMutation({
    mutationFn: ({
      text,
      priority,
      targetParticipantId
    }: {
      text: string;
      priority?: "normal" | "urgent" | "direction";
      targetParticipantId?: string;
    }) => sendAdminBroadcastMessage(id, { text, priority, targetParticipantId }),
    onSuccess: (msg) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-live-ride", id] });
      setCustomBroadcastText("");
      setCustomDirectMessageText("");
      setDirectMessageTarget(null);
      toast.success(
        msg.targetRiderName
          ? `Direct instruction sent to ${msg.targetRiderName}`
          : `Broadcast sent: "${msg.text}"`
      );
    },
    onError: (err) => toast.error(apiErrorMessage(err))
  });

  const statusMutation = useMutation({
    mutationFn: (nextStatus: "active" | "paused" | "completed") => updateLiveRideStatus(id, { status: nextStatus }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-live-ride", id] });
      toast.success(`Session status set to ${updated.status}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err))
  });

  const lockMutation = useMutation({
    mutationFn: (allowNew: boolean) => updateLiveRideStatus(id, { allowNewParticipants: allowNew }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-live-ride", id] });
      toast.success(updated.allowNewParticipants ? "New riders can join" : "Session locked to new riders");
    },
    onError: (err) => toast.error(apiErrorMessage(err))
  });

  const squadVisibilityMutation = useMutation({
    mutationFn: (visible: boolean) => updateLiveRideStatus(id, { showRiderCountToSquad: visible }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-live-ride", id] });
      toast.success(
        updated.showRiderCountToSquad
          ? "Rider count is now visible to all squad members"
          : "Rider count restricted to Admin & Marshals only"
      );
    },
    onError: (err) => toast.error(apiErrorMessage(err))
  });

  // Calculate live telemetry metrics
  const activeParticipants = useMemo(() => {
    if (!ride?.participants) return [];
    return ride.participants.filter(
      (p) => p.status === "active" && Date.now() - new Date(p.lastPingAt).getTime() < 120000
    );
  }, [ride?.participants]);

  const avgSpeed = useMemo(() => {
    if (!activeParticipants.length) return 0;
    const total = activeParticipants.reduce((sum, p) => sum + (p.speed || 0), 0);
    return Math.round(total / activeParticipants.length);
  }, [activeParticipants]);

  const leadParticipant = useMemo(() => {
    return ride?.participants?.find((p) => p.role === "lead" && p.status === "active");
  }, [ride?.participants]);

  // Filtered participants for Roster view
  const filteredParticipants = useMemo(() => {
    if (!ride?.participants) return [];
    const query = rosterSearch.trim().toLowerCase();

    return ride.participants.filter((p) => {
      if (query) {
        const matchesName = p.riderName.toLowerCase().includes(query);
        const matchesBike = p.bikeModel.toLowerCase().includes(query);
        const matchesNumber = p.bikeNumber ? p.bikeNumber.toLowerCase().includes(query) : false;
        const matchesPhone = p.phone ? p.phone.includes(query) : false;
        if (!matchesName && !matchesBike && !matchesNumber && !matchesPhone) {
          return false;
        }
      }

      const lastPingMs = p.lastPingAt ? new Date(p.lastPingAt).getTime() : 0;
      const isLive = p.status === "active" && lastPingMs > 0 && Date.now() - lastPingMs <= 45000;
      const isOffline = p.status === "active" && (!lastPingMs || Date.now() - lastPingMs > 45000);

      if (rosterFilter === "live") return isLive;
      if (rosterFilter === "offline") return isOffline;
      if (rosterFilter === "marshal") return p.role === "marshal" || p.role === "lead";

      return true;
    });
  }, [ride?.participants, rosterSearch, rosterFilter]);

  // Counts for filter chips
  const rosterCounts = useMemo(() => {
    const list = ride?.participants || [];
    let live = 0;
    let offline = 0;
    let marshal = 0;

    list.forEach((p) => {
      const lastPingMs = p.lastPingAt ? new Date(p.lastPingAt).getTime() : 0;
      const isLive = p.status === "active" && lastPingMs > 0 && Date.now() - lastPingMs <= 45000;
      const isOffline = p.status === "active" && (!lastPingMs || Date.now() - lastPingMs > 45000);
      if (isLive) live++;
      if (isOffline) offline++;
      if (p.role === "marshal" || p.role === "lead") marshal++;
    });

    return { total: list.length, live, offline, marshal };
  }, [ride?.participants]);

  // Latest message for floating radar alert ribbon (must be defined before conditional returns)
  const latestMessage = useMemo(() => {
    if (!ride?.messages?.length) return null;
    return ride.messages[ride.messages.length - 1];
  }, [ride?.messages]);

  const showFloatingRadarAlert = Boolean(
    latestMessage &&
      (latestMessage._id || latestMessage.sentAt) !== dismissedRadarAlertId &&
      (Date.now() - new Date(latestMessage.sentAt).getTime() < 300000 || latestMessage.priority === "urgent")
  );

  const selectedTargetParticipant = useMemo(() => {
    if (broadcastTargetId === "all" || !ride?.participants) return null;
    return ride.participants.find((p) => p._id === broadcastTargetId) || null;
  }, [broadcastTargetId, ride?.participants]);

  // Auto-scroll messages feed to bottom
  useEffect(() => {
    if (rightPanelTab === "broadcast" || mobileTab === "broadcast") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [ride?.messages?.length, rightPanelTab, mobileTab]);

  function handleCopyShareLink() {
    if (!ride) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/live-ride/${ride.code}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Rider invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function toggleLeaderGps() {
    if (!ride || !leadParticipant) {
      toast.error("No Lead participant found in this ride session");
      return;
    }
    if (adminTracking.isTracking) {
      adminTracking.stopTracking();
      toast.info("Leader GPS transmission stopped");
    } else {
      void adminTracking.startTracking(ride.code, leadParticipant._id);
      toast.success("Broadcasting your device GPS as Session Leader!");
    }
  }

  if (isLoading) {
    return (
      <AdminShell>
        <div className="h-96 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#ff535b] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (isError || !ride) {
    return (
      <AdminShell>
        <Card className="p-8 text-center max-w-md mx-auto">
          <ShieldAlert className="h-12 w-12 text-primary mx-auto mb-3" />
          <h2 className="font-display text-2xl text-white">Ride Session Not Found</h2>
          <p className="text-sm text-muted-foreground mt-2">{apiErrorMessage(error)}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/live-rides">Back to Live Rides</Link>
          </Button>
        </Card>
      </AdminShell>
    );
  }

  const isCompleted = ride.status === "completed";
  const isPaused = ride.status === "paused";
  const quickList = ride.quickMessages?.length ? ride.quickMessages : [];
  const messageList = ride.messages || [];

  function renderMissionControls() {
    if (!ride) return null;
    return (
      <div className="p-3 sm:p-4 space-y-3 font-mono text-xs overflow-y-auto">
        {/* Section 1: Session Status */}
        <div className="bg-[#181313] border border-[#3e2424] rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">
                Formation Status
              </span>
              <h4 className="font-display text-base text-white mt-0.5">
                {ride.status === "active"
                  ? "Ride is LIVE"
                  : isPaused
                  ? "Ride is PAUSED"
                  : "Ride COMPLETED"}
              </h4>
            </div>
            <span
              className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded border font-bold flex items-center gap-1.5 ${
                ride.status === "active"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                  : isPaused
                  ? "border-amber-500 text-amber-400 bg-amber-500/10"
                  : "border-zinc-600 text-zinc-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  ride.status === "active"
                    ? "bg-emerald-400 animate-pulse"
                    : isPaused
                    ? "bg-amber-400"
                    : "bg-zinc-500"
                }`}
              />
              {ride.status}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {!isCompleted ? (
              <Button
                size="sm"
                variant="outline"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate(isPaused ? "active" : "paused")}
                className="flex-1 font-mono text-xs border-[#552e2e] text-white hover:bg-[#281c1c]"
              >
                {isPaused ? (
                  <>
                    <Play className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Resume Formation
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5 mr-1 text-amber-400" /> Pause Formation
                  </>
                )}
              </Button>
            ) : null}

            {!isCompleted ? (
              <Button
                size="sm"
                variant="destructive"
                disabled={statusMutation.isPending}
                onClick={() => setConfirmEndRide(true)}
                className="font-mono text-xs bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40"
              >
                End Ride
              </Button>
            ) : null}
          </div>
        </div>

        {/* Section 2: Registration Lock */}
        <div className="bg-card border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                {ride.allowNewParticipants ? (
                  <LockOpen className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                )}
                <h4 className="font-bold text-foreground text-xs uppercase">Squad Registration</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ride.allowNewParticipants
                  ? "Riders can join via link or ride code."
                  : "Registration locked. No new participants can join."}
              </p>
            </div>
            <span
              className={`text-xs uppercase px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                ride.allowNewParticipants
                  ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500/50 text-amber-400 bg-amber-500/10"
              }`}
            >
              {ride.allowNewParticipants ? "Open" : "Locked"}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={lockMutation.isPending || isCompleted}
            onClick={() => lockMutation.mutate(!ride.allowNewParticipants)}
            className="w-full font-mono text-xs border-border text-foreground hover:bg-white/5"
          >
            {ride.allowNewParticipants ? "Lock to New Riders" : "Unlock Registration"}
          </Button>
        </div>

        {/* Section 3: Squad Rider Count Visibility */}
        <div className="bg-card border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                {ride.showRiderCountToSquad ? (
                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                )}
                <h4 className="font-bold text-foreground text-xs uppercase">Rider Count Privacy</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {ride.showRiderCountToSquad
                  ? "Total rider count is visible to all participants on their mobile HUD."
                  : "Rider count is hidden from squad, visible only to Admin & Marshals."}
              </p>
            </div>
            <span
              className={`text-xs uppercase px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                ride.showRiderCountToSquad
                  ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500/50 text-amber-400 bg-amber-500/10"
              }`}
            >
              {ride.showRiderCountToSquad ? "Public" : "Restricted"}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={squadVisibilityMutation.isPending || isCompleted}
            onClick={() => squadVisibilityMutation.mutate(!ride.showRiderCountToSquad)}
            className="w-full font-mono text-xs border-border text-foreground hover:bg-white/5"
          >
            {ride.showRiderCountToSquad
              ? "Restrict Count to Admin & Marshals"
              : "Make Count Visible to Squad"}
          </Button>
        </div>

        {/* Section 4: Leader GPS Stream */}
        {leadParticipant && !isCompleted && (
          <div className="bg-card border border-border rounded-xl p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-amber-300" />
                  <h4 className="font-bold text-foreground text-xs uppercase">Leader Device GPS</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {adminTracking.isTracking
                    ? "Transmitting GPS coordinates as Lead rider."
                    : "Stream this device's GPS to appear as the Lead marker."}
                </p>
              </div>
              <span
                className={`text-xs uppercase px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                  adminTracking.isTracking
                    ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10 animate-pulse"
                    : "border-zinc-700 text-zinc-400 bg-zinc-900"
                }`}
              >
                {adminTracking.isTracking ? "Streaming" : "Standby"}
              </span>
            </div>
            <Button
              size="sm"
              onClick={toggleLeaderGps}
              className={`w-full font-mono text-xs uppercase font-bold tracking-wider ${
                adminTracking.isTracking
                  ? "bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
              }`}
            >
              {adminTracking.isTracking ? "Stop Streaming Leader GPS" : "Start Streaming Leader GPS"}
            </Button>
          </div>
        )}

        {/* Section 5: Live Audio & Push Alerts */}
        <div className="bg-card border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-primary" />
                <h4 className="font-bold text-foreground text-xs uppercase">Audio & Push Alerts</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Receive native browser notifications and synthesized motorsport chimes when marshals or riders transmit alerts.
              </p>
            </div>
            <span
              className={`text-xs uppercase px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                notifPermission === "granted"
                  ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                  : notifPermission === "denied"
                  ? "border-red-500/50 text-red-400 bg-red-500/10"
                  : "border-amber-500/50 text-amber-400 bg-amber-500/10"
              }`}
            >
              {notifPermission === "granted" ? "Active" : notifPermission === "denied" ? "Blocked" : "Pending"}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {notifPermission !== "granted" ? (
              <Button
                size="sm"
                onClick={handleEnableNotifications}
                className="flex-1 font-mono text-xs bg-amber-600 hover:bg-amber-500 text-black font-bold cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5 mr-1" /> Enable Browser Alerts
              </Button>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => playTacticalAlertChime("direction")}
                  className="flex-1 font-mono text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40 cursor-pointer"
                >
                  <Volume2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Test Route Chime
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => playTacticalAlertChime("urgent")}
                  className="flex-1 font-mono text-xs border-red-500/40 text-red-300 hover:bg-red-950/40 cursor-pointer"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1 text-red-400" /> Test Siren
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Section 6: Quick Invite Link & Code */}
        <div className="bg-card border border-border rounded-xl p-3 space-y-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground block font-bold">
            Squad Invite Link
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 p-2 bg-background border border-border rounded font-mono text-xs text-muted-foreground truncate">
              {typeof window !== "undefined" ? window.location.origin : ""}/live-ride/{ride.code}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyShareLink}
              className="h-8 px-2.5 border-border text-foreground hover:bg-white/5"
              aria-label="Copy squad invite link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex-1 font-mono text-xs border-border text-foreground hover:bg-white/5"
            >
              <a href={`/live-ride/${ride.code}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1 text-primary" /> Test as Rider HUD
              </a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowQrModal(true)}
              className="font-mono text-xs border-border text-foreground hover:bg-white/5 cursor-pointer"
            >
              <QrCode className="h-3.5 w-3.5 mr-1 text-primary" /> QR / Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell>
      <div className="motion-page space-y-2.5 sm:space-y-3">
        {/* 1. COMPACT MISSION COMMAND BAR (1-ROW MOTORSPORT HEADER) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 min-h-[48px] bg-card border border-border px-3 py-2 rounded-xl">
          {/* Left: Back button + Title + Status badge + Code pill + Route */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0 border-border text-foreground hover:bg-white/5">
              <Link href="/admin/live-rides" title="Back to All Live Rides" aria-label="Back to All Live Rides">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-base sm:text-xl text-foreground truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">
                  {ride.title}
                </h1>
                <span
                  className={`font-mono text-xs uppercase h-6 px-2 rounded-md border inline-flex items-center gap-1.5 font-bold ${
                    ride.status === "active"
                      ? "border-emerald-500/60 text-emerald-400 bg-emerald-500/10"
                      : isPaused
                      ? "border-amber-500/60 text-amber-400 bg-amber-500/10"
                      : "border-border text-muted-foreground bg-white/5"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${ride.status === "active" ? "bg-emerald-400 animate-pulse" : isPaused ? "bg-amber-400" : "bg-muted-foreground"}`} />
                  {ride.status}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(ride.code);
                    toast.success(`Ride code ${ride.code} copied!`);
                  }}
                  title="Click to copy ride code"
                  aria-label={`Copy ride code ${ride.code}`}
                  className="font-mono text-xs text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 border border-border h-6 px-2 rounded-md inline-flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <span>#{ride.code}</span>
                  <Copy className="h-3 w-3 opacity-70" />
                </button>
              </div>
              {(ride.startLocation || ride.destination) && (
                <p className="text-xs font-mono text-muted-foreground truncate hidden sm:block">
                  {ride.startLocation ? ride.startLocation : ""}
                  {ride.destination ? ` → ${ride.destination}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Right: Sleek Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* QR Code & Squad Invite Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                handleCopyShareLink();
                setShowQrModal(true);
              }}
              className="h-8 px-2.5 text-xs font-mono border-border text-foreground hover:bg-white/5 cursor-pointer inline-flex items-center gap-1.5"
              title="View & Download QR Code / Invite Link"
              aria-label="View QR Code and Invite Link"
            >
              <QrCode className="h-3.5 w-3.5 text-primary" />
              <span>QR & Invite</span>
            </Button>

            {/* Test as Rider */}
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs font-mono border-border text-foreground hover:bg-white/5 inline-flex items-center gap-1.5"
              title="Open Rider HUD in new tab"
              aria-label="Test Rider HUD in New Tab"
            >
              <a href={`/live-ride/${ride.code}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Test</span>
              </a>
            </Button>

            {/* Leader GPS Toggle */}
            {leadParticipant && !isCompleted && (
              <Button
                size="sm"
                onClick={toggleLeaderGps}
                className={`h-8 px-2.5 text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1.5 ${
                  adminTracking.isTracking
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-400/40"
                }`}
                title={adminTracking.isTracking ? "Leader GPS: ON (Click to stop)" : "Stream device GPS as Leader"}
                aria-label={adminTracking.isTracking ? "Leader GPS Active, click to stop" : "Stream device GPS as Leader"}
              >
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                <span className="hidden md:inline">{adminTracking.isTracking ? "GPS ON" : "Stream GPS"}</span>
              </Button>
            )}

            {/* Live Browser Notifications Indicator / Toggle */}
            {notifPermission !== "granted" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEnableNotifications}
                className="h-8 px-2.5 text-xs font-mono border-amber-500/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 cursor-pointer inline-flex items-center gap-1.5"
                title="Enable browser notifications for incoming tactical messages"
                aria-label="Enable browser notifications"
              >
                <Bell className="h-3.5 w-3.5 text-amber-400 animate-bounce" />
                <span className="hidden sm:inline">Allow Alerts</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  playTacticalAlertChime("direction");
                  toast.success("Alert audio test played!");
                }}
                className="h-8 px-2.5 text-xs font-mono border-emerald-500/40 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40 inline-flex items-center gap-1.5 cursor-pointer transition"
                title="Browser alerts active! Click to test sound."
                aria-label="Browser alerts active. Click to test sound"
              >
                <Bell className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden md:inline font-bold">Alerts On</span>
                <Volume2 className="h-3 w-3 opacity-70 hover:opacity-100" />
              </Button>
            )}
          </div>
        </div>

        {/* 2. SLEEK UNIFIED TELEMETRY STRIP (Neutralized secondary data, no Christmas-tree effect) */}
        <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center justify-between gap-3 overflow-x-auto text-xs font-mono scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-muted-foreground text-xs hidden xs:inline">Transmitting:</span>
            <strong className="text-foreground font-semibold text-xs">{activeParticipants.length}</strong>
            <span className="text-muted-foreground text-xs">live</span>
          </div>

          <span className="text-border">|</span>

          <div className="flex items-center gap-1.5 shrink-0">
            <Compass className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-xs hidden xs:inline">Speed:</span>
            <strong className="text-foreground font-semibold text-xs">{avgSpeed}</strong>
            <span className="text-muted-foreground text-xs">km/h</span>
          </div>

          <span className="text-border">|</span>

          <div className="flex items-center gap-1.5 shrink-0">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-xs hidden xs:inline">Marshals:</span>
            <strong className="text-foreground font-semibold text-xs">
              {rosterCounts.marshal}
            </strong>
            <span className="text-muted-foreground text-xs">guides</span>
          </div>

          <span className="text-border">|</span>

          <div className="flex items-center gap-1.5 shrink-0">
            <MessageSquare className={`h-3.5 w-3.5 ${messageList.length > 0 ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-muted-foreground text-xs hidden xs:inline">Alerts:</span>
            <strong className="text-foreground font-semibold text-xs">{messageList.length}</strong>
            <span className="text-muted-foreground text-xs">sent</span>
          </div>
        </div>

        {/* 3. MOBILE 4-MODE SEGMENTED DOCK (Radar / Roster / Alerts / Controls) */}
        <div className="grid grid-cols-4 lg:hidden rounded-lg bg-card p-1 border border-border font-mono">
          <button
            type="button"
            onClick={() => setMobileTab("map")}
            className={`py-2 text-xs uppercase tracking-wider rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mobileTab === "map"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Radar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab("roster");
              setRightPanelTab("roster");
            }}
            className={`py-2 text-xs uppercase tracking-wider rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mobileTab === "roster"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Roster ({rosterCounts.live}/{rosterCounts.total})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab("broadcast");
              setRightPanelTab("broadcast");
            }}
            className={`py-2 text-xs uppercase tracking-wider rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mobileTab === "broadcast"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <BellRing className="h-3.5 w-3.5" />
            <span>Alerts ({messageList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab("controls");
              setRightPanelTab("controls");
            }}
            className={`py-2 text-xs uppercase tracking-wider rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mobileTab === "controls"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Controls</span>
          </button>
        </div>

        {/* 4. MAIN COCKPIT WORK AREA */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_370px] xl:grid-cols-[1fr_420px] gap-3 min-h-[480px] lg:h-[calc(100vh-200px)]">
          {/* Tactical Dark Map */}
          <div className={`w-full h-[calc(100vh-250px)] min-h-[440px] lg:h-full relative ${mobileTab === "map" ? "block" : "hidden lg:block"}`}>
            {/* FLOATING HEADS-UP TACTICAL ALERT RIBBON */}
            {showFloatingRadarAlert && latestMessage && (
              <div
                className={`absolute top-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-[1000] p-3 rounded-xl border-2 backdrop-blur-md shadow-2xl transition-all animate-in fade-in slide-in-from-top-3 ${
                  latestMessage.priority === "urgent"
                    ? "bg-[#250909]/95 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.35)]"
                    : latestMessage.priority === "direction"
                    ? "bg-[#061821]/95 border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.3)]"
                    : "bg-[#18130e]/95 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {latestMessage.priority === "urgent" ? (
                      <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-500/30 text-red-300 border border-red-500 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="h-3 w-3 text-red-400" /> URGENT STOP
                      </span>
                    ) : latestMessage.priority === "direction" ? (
                      <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/30 text-cyan-300 border border-cyan-500 flex items-center gap-1">
                        <Compass className="h-3 w-3 text-cyan-400" /> ROUTE GUIDE
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/60 flex items-center gap-1">
                        <Radio className="h-3 w-3 text-amber-400" /> SQUAD ALERT
                      </span>
                    )}

                    <span className="font-mono text-xs text-white font-bold">
                      {latestMessage.senderName}
                    </span>

                    {latestMessage.targetRiderName && (
                      <span className="font-mono text-[9px] text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">
                        → {latestMessage.targetRiderName}
                      </span>
                    )}

                    <span className="font-mono text-[10px] text-muted-foreground">
                      {new Date(latestMessage.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDismissedRadarAlertId(latestMessage._id || latestMessage.sentAt)}
                    className="text-muted-foreground hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
                    aria-label="Dismiss alert banner"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-1.5 text-xs sm:text-sm font-semibold text-white tracking-wide font-sans leading-snug break-words">
                  {latestMessage.text}
                </p>
              </div>
            )}

            <TacticalMap
              participants={ride.participants}
              selectedParticipantId={selectedRiderId}
              onSelectParticipant={(pId) => setSelectedRiderId(pId)}
              onEjectParticipant={(pId, name) => setEjectTarget({ id: pId, name })}
              onRoleChange={(pId, role) => roleMutation.mutate({ participantId: pId, role })}
              onDirectMessage={(pId, name) => setDirectMessageTarget({ id: pId, name })}
              myParticipantId={leadParticipant?._id}
            />

            {/* Mobile Map Action Shelf (Dedicated semi-transparent dock container) */}
            <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="bg-background/90 backdrop-blur-md border border-border shadow-xl px-3 py-1.5 rounded-full flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setMobileTab("broadcast");
                    setRightPanelTab("broadcast");
                  }}
                  className="h-7 px-3 rounded-full text-xs font-mono uppercase tracking-wider text-primary border-primary/40 bg-primary/10 hover:bg-primary/20 flex items-center gap-1.5 cursor-pointer"
                  aria-label="Open 1-Tap Broadcast Alert"
                >
                  <BellRing className="h-3.5 w-3.5" />
                  <span>1-Tap Alert</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Control Deck Container */}
          <Card className={`w-full h-[calc(100vh-250px)] min-h-[440px] lg:h-full flex flex-col bg-card border-border overflow-hidden ${
            mobileTab !== "map" ? "flex" : "hidden lg:flex"
          }`}>
            {/* Desktop Deck Switcher Tabs */}
            <div className="p-2 border-b border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-1 w-full font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setRightPanelTab("roster");
                    setMobileTab("roster");
                  }}
                  className={`flex-1 py-1.5 px-2 text-xs uppercase tracking-wider rounded-md font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    (mobileTab === "roster" || rightPanelTab === "roster")
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Roster ({rosterCounts.total})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRightPanelTab("broadcast");
                    setMobileTab("broadcast");
                  }}
                  className={`flex-1 py-1.5 px-2 text-xs uppercase tracking-wider rounded-md font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    (mobileTab === "broadcast" || rightPanelTab === "broadcast")
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <BellRing className="h-3.5 w-3.5" />
                  <span>Alerts ({messageList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRightPanelTab("controls");
                    setMobileTab("controls");
                  }}
                  className={`flex-1 py-1.5 px-2 text-xs uppercase tracking-wider rounded-md font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    (mobileTab === "controls" || rightPanelTab === "controls")
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Controls</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: SQUAD ROSTER WITH SEARCH & FILTER CHIPS */}
            {(mobileTab === "roster" || (mobileTab === "map" && rightPanelTab === "roster")) ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Search Bar & Filter Chips */}
                <div className="p-2.5 pb-2 border-b border-border bg-card space-y-2 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      placeholder="Search rider, bike, plate, phone..."
                      className="pl-8 pr-7 h-8 text-xs bg-background border-border text-foreground focus:border-primary"
                    />
                    {rosterSearch && (
                      <button
                        type="button"
                        onClick={() => setRosterSearch("")}
                        aria-label="Clear roster search"
                        className="absolute right-2.5 top-2 text-muted-foreground hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-mono uppercase">
                    <button
                      type="button"
                      onClick={() => setRosterFilter("all")}
                      className={`px-2 py-1 rounded transition whitespace-nowrap cursor-pointer ${
                        rosterFilter === "all"
                          ? "bg-primary text-white font-bold"
                          : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-border"
                      }`}
                    >
                      All ({rosterCounts.total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRosterFilter("live")}
                      className={`px-2 py-1 rounded transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                        rosterFilter === "live"
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-white/5 text-emerald-400 hover:bg-white/10 border border-border"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Live ({rosterCounts.live})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRosterFilter("offline")}
                      className={`px-2 py-1 rounded transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                        rosterFilter === "offline"
                          ? "bg-amber-600 text-white font-bold"
                          : "bg-white/5 text-amber-400 hover:bg-white/10 border border-border"
                      }`}
                    >
                      Offline ({rosterCounts.offline})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRosterFilter("marshal")}
                      className={`px-2 py-1 rounded transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                        rosterFilter === "marshal"
                          ? "bg-cyan-600 text-white font-bold"
                          : "bg-white/5 text-cyan-400 hover:bg-white/10 border border-border"
                      }`}
                    >
                      <Compass className="h-2.5 w-2.5" />
                      Marshals ({rosterCounts.marshal})
                    </button>
                  </div>
                </div>

                {/* Participant Scroll Area */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-border">
                  {filteredParticipants.length === 0 ? (
                    <div className="p-6 text-center text-xs font-mono space-y-3 my-auto">
                      <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center mx-auto text-primary">
                        <Bike className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg text-foreground">
                          {rosterSearch ? "No Matching Riders" : "Formation Empty"}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                          {rosterSearch
                            ? `No participants matched "${rosterSearch}".`
                            : "No riders have joined yet. Share the invite link to start formation."}
                        </p>
                      </div>
                      {rosterSearch ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRosterSearch("");
                            setRosterFilter("all");
                          }}
                          className="font-mono text-xs border-border text-foreground hover:bg-white/5 mx-auto"
                        >
                          Clear Search
                        </Button>
                      ) : (
                        <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                          <Button asChild size="sm" className="font-mono text-xs uppercase bg-primary hover:bg-primary/90 text-white shadow-md">
                            <a href={`/live-ride/${ride.code}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Test as First Rider
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowQrModal(true)} className="font-mono text-xs border-border text-foreground hover:bg-white/5 cursor-pointer">
                            <QrCode className="h-3.5 w-3.5 mr-1.5 text-primary" /> QR & Invite Link
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredParticipants.map((p) => {
                      const isLead = p.role === "lead";
                      const isMarshal = p.role === "marshal";
                      const isSweeper = p.role === "sweeper";
                      const isPillion = p.role === "pillion" || Boolean(p.isPillion);
                      const isEjected = p.status === "ejected";
                      const isLeft = p.status === "left";
                      const isSelected = p._id === selectedRiderId;

                      const lastPingMs = p.lastPingAt ? new Date(p.lastPingAt).getTime() : 0;
                      const isOffline = !lastPingMs || Date.now() - lastPingMs > 45000;

                      let timeAgoText = "just now";
                      if (isOffline && lastPingMs > 0) {
                        const diffSec = Math.floor((Date.now() - lastPingMs) / 1000);
                        if (diffSec < 60) timeAgoText = `${diffSec}s ago`;
                        else if (diffSec < 3600) timeAgoText = `${Math.floor(diffSec / 60)}m ago`;
                        else timeAgoText = `${Math.floor(diffSec / 3600)}h ago`;
                      }

                      const roleColor = isLead ? "#ffd700" : isMarshal ? "#00f0ff" : isSweeper ? "#a855f7" : isPillion ? "#f97316" : "#ff535b";
                      const avatarBorderColor = isOffline ? "#f59e0b" : roleColor;

                      return (
                        <div
                          key={p._id}
                          className={`p-2.5 rounded-lg transition-colors pt-2.5 ${
                            isSelected
                              ? "bg-card border border-primary/60"
                              : isEjected
                              ? "bg-muted/40 opacity-60 border border-transparent"
                              : isOffline
                              ? "bg-card border border-amber-500/20"
                              : "hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {p.profileImage ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={p.profileImage}
                                  alt={p.riderName}
                                  className={`w-9 h-9 rounded-full object-cover border-2 shrink-0 shadow ${isOffline ? "grayscale-[30%]" : ""}`}
                                  style={{ borderColor: avatarBorderColor }}
                                />
                              ) : (
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-black shrink-0 shadow font-sans"
                                  style={{ backgroundColor: avatarBorderColor }}
                                >
                                  {(p.riderName[0] || "R").toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="font-bold text-sm text-foreground truncate max-w-[120px] xs:max-w-[160px]">{p.riderName}</span>
                                  {isLead ? (
                                    <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                                      <Crown className="h-2.5 w-2.5" /> Lead
                                    </span>
                                  ) : isMarshal ? (
                                    <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-0.5">
                                      <Compass className="h-2.5 w-2.5" /> Marshal
                                    </span>
                                  ) : isSweeper ? (
                                    <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                      Tail
                                    </span>
                                  ) : isPillion ? (
                                    <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                                      Pillion
                                    </span>
                                  ) : null}

                                  {isOffline && !isEjected && !isLeft ? (
                                    <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                      Offline ({timeAgoText})
                                    </span>
                                  ) : !isEjected && !isLeft ? (
                                    <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                      Live
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                                  {p.bikeModel} {p.bikeNumber ? `(${p.bikeNumber})` : ""}
                                  {p.pillionRiderName ? ` · with ${p.pillionRiderName}` : ""}
                                </p>
                              </div>
                            </div>

                            {/* Speed / telemetry badge */}
                            <div className="text-right shrink-0">
                              <span className={`font-mono text-xs font-bold ${isOffline ? "text-amber-400" : "text-primary"}`}>
                                {isOffline ? `Last: ${p.speed}` : p.speed} <small className="text-xs text-muted-foreground font-normal">km/h</small>
                              </span>
                              <span className="block text-xs font-mono text-muted-foreground">
                                {isEjected ? "Ejected" : isLeft ? "Left" : isOffline ? `Last ${timeAgoText}` : `±${p.accuracy}m GPS`}
                              </span>
                            </div>
                          </div>

                          {/* Granular Rider Action Controls */}
                          {!isEjected && !isLeft ? (
                            <div className="mt-2 pt-1.5 border-t border-border flex flex-wrap items-center justify-between gap-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRiderId(p._id);
                                    setMobileTab("map");
                                  }}
                                  className="text-xs font-mono uppercase px-2 py-0.5 bg-white/5 hover:bg-white/10 text-foreground border border-border rounded transition cursor-pointer"
                                >
                                  Focus
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDirectMessageTarget({ id: p._id, name: p.riderName })}
                                  className="text-xs font-mono uppercase px-2 py-0.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-500/40 rounded transition flex items-center gap-1 cursor-pointer"
                                  title="Send direct tactical instruction to this rider"
                                >
                                  <MessageSquare className="h-3 w-3 text-emerald-400" /> Whisper
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextRole: ParticipantRole = isMarshal ? "rider" : "marshal";
                                    roleMutation.mutate({ participantId: p._id, role: nextRole });
                                  }}
                                  className={`text-xs font-mono uppercase px-2 py-0.5 rounded transition border ${
                                    isMarshal
                                      ? "bg-cyan-950/50 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900/50"
                                      : "bg-white/5 text-muted-foreground border-border hover:bg-white/10"
                                  }`}
                                  title={isMarshal ? "Remove Marshal role" : "Promote to Ride Marshal (Direction Guide)"}
                                >
                                  {isMarshal ? "✓ Marshal" : "+ Marshal"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextRole: ParticipantRole = isLead ? "rider" : "lead";
                                    roleMutation.mutate({ participantId: p._id, role: nextRole });
                                  }}
                                  className="text-xs font-mono uppercase px-2 py-0.5 bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-500/30 rounded transition"
                                >
                                  {isLead ? "Demote" : "Make Lead"}
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => setEjectTarget({ id: p._id, name: p.riderName })}
                                className="text-xs font-mono uppercase px-2 py-0.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded transition flex items-center gap-1 cursor-pointer"
                              >
                                <UserMinus className="h-3 w-3" /> Eject
                              </button>
                            </div>
                          ) : (
                            <p className="mt-1 text-xs font-mono text-red-400">
                              {isEjected ? "Removed by admin (GPS off)" : "Rider exited session"}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}

            {/* TAB CONTENT 2: TACTICAL COMMS & ALERTS DECK */}
            {(mobileTab === "broadcast" || (mobileTab === "map" && rightPanelTab === "broadcast")) ? (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#0d0909]">
                {/* 1. COMMS SUB-HEADER: TARGET SELECTOR & QUICK DISPATCH TOGGLE */}
                <div className="p-2 sm:p-2.5 border-b border-[#352323] bg-[#140e0e] flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="font-mono text-[9px] uppercase font-bold text-muted-foreground shrink-0">
                      To:
                    </span>
                    <select
                      value={broadcastTargetId}
                      onChange={(e) => setBroadcastTargetId(e.target.value)}
                      aria-label="Broadcast Target"
                      className="bg-[#100b0b] text-[11px] font-mono text-white border border-[#442828] rounded px-2 py-1 focus:border-[#ff535b] outline-none cursor-pointer truncate max-w-full font-semibold"
                    >
                      <option value="all">👥 Entire Formation (All Squad)</option>
                      {ride.participants
                        .filter((p) => p.status === "active")
                        .map((p) => (
                          <option key={p._id} value={p._id}>
                            🎯 Whisper: {p.riderName} ({p.bikeModel})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Toggle Quick Dispatches */}
                  {quickList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowQuickDispatches(!showQuickDispatches)}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-border text-xs font-mono text-foreground flex items-center gap-1 shrink-0 cursor-pointer font-bold transition"
                      title={showQuickDispatches ? "Collapse Quick Dispatches" : "Expand Quick Dispatches"}
                      aria-label="Toggle Quick Dispatches"
                    >
                      <Sparkles className="h-3 w-3 text-cyan-400" />
                      <span>Quick ({quickList.length})</span>
                      {showQuickDispatches ? (
                        <ChevronUp className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>

                {/* Active Whisper Banner if a single rider is targeted */}
                {broadcastTargetId !== "all" && selectedTargetParticipant && (
                  <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 truncate">
                      <Lock className="h-3 w-3 shrink-0 text-amber-400" />
                      <span className="truncate">
                        Whispering to <strong>{selectedTargetParticipant.riderName}</strong> ({selectedTargetParticipant.bikeModel})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBroadcastTargetId("all")}
                      className="text-[9px] font-mono uppercase text-amber-400 hover:text-white underline shrink-0 cursor-pointer"
                    >
                      Reset to All
                    </button>
                  </div>
                )}

                {/* 2. COLLAPSIBLE 1-TAP QUICK DISPATCH CHIPS */}
                {showQuickDispatches && quickList.length > 0 && (
                  <div className="p-2 sm:p-2.5 bg-card border-b border-border shrink-0 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                        1-Tap Presets ({broadcastTargetId === "all" ? "Squad" : "Whisper"})
                      </span>
                      <span className="text-xs text-muted-foreground">Instant Send</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-0.5">
                      {quickList.map((msg, idx) => {
                        const parsed = parseQuickMessage(msg);
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={broadcastMutation.isPending}
                            title={msg}
                            onClick={() =>
                              broadcastMutation.mutate({
                                text: msg,
                                priority: parsed.priority,
                                targetParticipantId: broadcastTargetId !== "all" ? broadcastTargetId : undefined
                              })
                            }
                            className={`text-left p-1.5 rounded-lg border transition-all flex items-center gap-1.5 group cursor-pointer active:scale-95 ${
                              parsed.priority === "urgent"
                                ? "bg-red-950/40 hover:bg-red-900/50 border-red-500/50 text-red-300"
                                : parsed.priority === "direction"
                                ? "bg-cyan-950/40 hover:bg-cyan-900/50 border-cyan-500/50 text-cyan-300"
                                : "bg-white/5 hover:bg-white/10 border-border text-foreground"
                            }`}
                          >
                            <span className="text-xs shrink-0">{parsed.icon}</span>
                            <div className="min-w-0 flex-1">
                              <span className="block text-xs font-mono font-bold truncate leading-tight">
                                {parsed.shortLabel}
                              </span>
                            </div>
                            <Send className="h-2.5 w-2.5 text-muted-foreground group-hover:text-white shrink-0 opacity-60 group-hover:opacity-100" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. BROADCAST TIMELINE FEED (PRIMARY MAIN BODY - FLEX-1) */}
                <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2.5 min-h-0 overscroll-contain">
                  {!messageList.length ? (
                    <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-2">
                      <div className="p-3 rounded-full bg-card border border-border">
                        <Radio className="h-6 w-6 text-primary" />
                      </div>
                      <span className="font-mono text-xs font-bold uppercase text-foreground tracking-wider">
                        Frequency Open & Standing By
                      </span>
                      <p className="text-xs max-w-[240px] text-muted-foreground font-sans">
                        No transmissions logged yet. Tap a quick dispatch chip above or send a broadcast below.
                      </p>
                    </div>
                  ) : (
                    messageList.map((msg, i) => (
                      <div
                        key={msg._id || i}
                        className={`p-2.5 rounded-xl border text-xs transition-all shadow-sm ${
                          msg.priority === "urgent"
                            ? "bg-gradient-to-r from-red-950/40 to-red-950/20 border-l-4 border-l-red-500 border-red-500/40 shadow-sm"
                            : msg.priority === "direction"
                            ? "bg-gradient-to-r from-cyan-950/40 to-cyan-950/20 border-l-4 border-l-cyan-400 border-cyan-500/40 shadow-sm"
                            : "bg-card border-border hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            {msg.senderRole === "lead" ? (
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase bg-amber-950/60 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
                                <Crown className="h-2.5 w-2.5" /> Lead
                              </span>
                            ) : msg.senderRole === "marshal" ? (
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                                <Shield className="h-2.5 w-2.5" /> Marshal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase bg-primary/10 text-primary border border-primary/30 px-1.5 py-0.5 rounded">
                                <Radio className="h-2.5 w-2.5" /> Admin
                              </span>
                            )}
                            <span className="font-sans font-bold text-foreground text-xs truncate max-w-[120px]">
                              {msg.senderName}
                            </span>
                            {msg.targetRiderName ? (
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                <Lock className="h-2.5 w-2.5" /> Direct to {msg.targetRiderName}
                              </span>
                            ) : null}
                          </div>
                          <span className="font-mono text-xs text-muted-foreground shrink-0">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                        <p className="font-sans text-xs sm:text-sm text-foreground leading-relaxed break-words font-medium">
                          {msg.text}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 4. DOCKED TACTICAL COMPOSER (BOTTOM BAR) */}
                <div className="p-2.5 sm:p-3 bg-card border-t border-border space-y-2 shrink-0">
                  {/* Priority Pill Selector */}
                  <div className="flex items-center justify-between gap-1 text-xs font-mono">
                    <span className="text-muted-foreground uppercase text-xs font-bold">Severity:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBroadcastPriority("normal")}
                        className={`px-2 py-0.5 rounded transition cursor-pointer font-bold ${
                          broadcastPriority === "normal"
                            ? "bg-white/15 text-white border border-border"
                            : "bg-white/5 text-muted-foreground border border-transparent hover:text-white"
                        }`}
                      >
                        🟢 Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => setBroadcastPriority("direction")}
                        className={`px-2 py-0.5 rounded transition cursor-pointer font-bold ${
                          broadcastPriority === "direction"
                            ? "bg-cyan-950/50 text-cyan-300 border border-cyan-500/50"
                            : "bg-white/5 text-muted-foreground border border-transparent hover:text-cyan-400"
                        }`}
                      >
                        🧭 Route
                      </button>
                      <button
                        type="button"
                        onClick={() => setBroadcastPriority("urgent")}
                        className={`px-2 py-0.5 rounded transition cursor-pointer font-bold ${
                          broadcastPriority === "urgent"
                            ? "bg-primary/20 text-primary border border-primary/50 shadow-sm"
                            : "bg-white/5 text-muted-foreground border border-transparent hover:text-primary"
                        }`}
                      >
                        🚨 Urgent
                      </button>
                    </div>
                  </div>

                  {/* Input Box & Send Button */}
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={customBroadcastText}
                      onChange={(e) => setCustomBroadcastText(e.target.value)}
                      placeholder={
                        broadcastTargetId === "all"
                          ? "Broadcast to squad... (Enter ↵)"
                          : `Whisper to ${selectedTargetParticipant?.riderName || "rider"}... (Enter ↵)`
                      }
                      className="h-9 sm:h-10 text-xs bg-background border-border text-foreground rounded-lg focus-visible:ring-primary focus-visible:border-primary"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && customBroadcastText.trim()) {
                          e.preventDefault();
                          broadcastMutation.mutate({
                            text: customBroadcastText.trim(),
                            priority: broadcastPriority,
                            targetParticipantId: broadcastTargetId !== "all" ? broadcastTargetId : undefined
                          });
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={broadcastMutation.isPending || !customBroadcastText.trim()}
                      onClick={() =>
                        broadcastMutation.mutate({
                          text: customBroadcastText.trim(),
                          priority: broadcastPriority,
                          targetParticipantId: broadcastTargetId !== "all" ? broadcastTargetId : undefined
                        })
                      }
                      className="h-9 sm:h-10 px-3.5 bg-primary hover:bg-primary/90 text-white font-mono text-xs uppercase tracking-wider font-bold shrink-0 shadow-sm cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      <span>Send</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* TAB CONTENT 3: MISSION CONTROLS DECK */}
            {(mobileTab === "controls" || (mobileTab === "map" && rightPanelTab === "controls")) ? (
              <div className="flex-1 overflow-hidden flex flex-col">
                {renderMissionControls()}
              </div>
            ) : null}
          </Card>
        </div>

        {/* 1-to-1 Direct Message (Whisper) Modal */}
        {directMessageTarget ? (
          <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-md p-5 bg-card border-border shadow-2xl rounded-xl relative z-[10000] max-h-[90vh] overflow-y-auto my-auto">
              <div className="flex items-center justify-between mb-3 border-b border-border pb-2.5">
                <div>
                  <span className="text-xs font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                    1-to-1 Tactical Whisper
                  </span>
                  <h3 className="font-display text-2xl text-foreground mt-1">Direct to {directMessageTarget.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDirectMessageTarget(null)}
                  aria-label="Close direct whisper dialog"
                  className="text-muted-foreground hover:text-white p-1 rounded hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs font-mono text-muted-foreground mb-3 leading-relaxed">
                This instruction will beam directly to <strong>{directMessageTarget.name}&apos;s</strong> cockpit HUD with an urgent chime and vibration.
              </p>

              {/* 1-Tap Quick Suggestion Chips */}
              <div className="space-y-1.5 mb-4">
                <span className="text-xs font-mono uppercase text-muted-foreground block font-bold">
                  Tap to Send Instant Direct Alert:
                </span>
                <div className="grid grid-cols-1 gap-1.5 font-mono text-xs">
                  {[
                    "🏍️ Follow us closely / Catch up with formation",
                    "⚠️ Pull over on left shoulder / Wait for squad",
                    "⛽ Low fuel check / Signal status",
                    "🚨 Hazard ahead: slow down and maintain safe gap"
                  ].map((quickText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={broadcastMutation.isPending}
                      onClick={() =>
                        broadcastMutation.mutate({
                          text: quickText,
                          priority: "urgent",
                          targetParticipantId: directMessageTarget.id
                        })
                      }
                      className="text-left px-3 py-2 rounded bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-border hover:border-emerald-500/60 text-xs text-foreground transition flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate pr-2">{quickText}</span>
                      <Send className="h-3 w-3 text-muted-foreground group-hover:text-emerald-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message Field & Priority Selector */}
              <div className="space-y-2 pt-2 border-t border-border font-mono text-xs">
                <div className="flex items-center justify-between">
                  <label className="block text-xs uppercase text-foreground font-bold">
                    Custom Tactical Instruction:
                  </label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground uppercase">Alert:</span>
                    {(["urgent", "direction", "normal"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDirectMessagePriority(p)}
                        className={`px-2 py-0.5 rounded uppercase font-bold cursor-pointer transition ${
                          directMessagePriority === p
                            ? p === "urgent"
                              ? "bg-red-500/30 text-red-300 border border-red-500"
                              : p === "direction"
                              ? "bg-cyan-950/50 text-cyan-300 border border-cyan-500"
                              : "bg-white/20 text-white border border-white/40"
                            : "text-muted-foreground hover:text-white"
                        }`}
                      >
                        {p === "urgent" ? "⚠️ Urgent" : p === "direction" ? "🧭 Path" : "ℹ️ Normal"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customDirectMessageText}
                    onChange={(e) => setCustomDirectMessageText(e.target.value)}
                    placeholder="e.g. Follow the white Tiger 900 ahead"
                    className="h-11 bg-background border-border text-foreground text-xs focus:border-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customDirectMessageText.trim()) {
                        e.preventDefault();
                        broadcastMutation.mutate({
                          text: customDirectMessageText.trim(),
                          priority: directMessagePriority,
                          targetParticipantId: directMessageTarget.id
                        });
                      }
                    }}
                  />
                  <Button
                    disabled={broadcastMutation.isPending || !customDirectMessageText.trim()}
                    onClick={() =>
                      broadcastMutation.mutate({
                        text: customDirectMessageText.trim(),
                        priority: directMessagePriority,
                        targetParticipantId: directMessageTarget.id
                      })
                    }
                    className="h-11 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase font-bold shrink-0 cursor-pointer"
                  >
                    {broadcastMutation.isPending ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="inline-flex items-center">
                        <Send className="h-3.5 w-3.5 mr-1" /> Send
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Eject Confirmation Dialog */}
        <ConfirmDialog
          open={Boolean(ejectTarget)}
          onOpenChange={(open) => !open && setEjectTarget(null)}
          title={`Remove ${ejectTarget?.name} from Ride?`}
          description={
            ejectTarget
              ? `This will immediately disconnect ${ejectTarget.name}'s phone from the tracking radar, shut off their background GPS listener, and remove their motorcycle marker from the tactical map.`
              : ""
          }
          confirmLabel="Eject Rider Now"
          pending={ejectMutation.isPending}
          onConfirm={() => ejectTarget && ejectMutation.mutate({ participantId: ejectTarget.id })}
        />

        {/* End Ride Confirmation Dialog */}
        <ConfirmDialog
          open={confirmEndRide}
          onOpenChange={(open) => setConfirmEndRide(open)}
          title="End Live Ride Session?"
          description={`Ending "${ride.title}" will dismiss the entire squad formation and stop GPS tracking for all connected riders.`}
          confirmLabel="End Ride Now"
          pending={statusMutation.isPending}
          onConfirm={() => {
            setConfirmEndRide(false);
            statusMutation.mutate("completed");
          }}
        />

        {/* Working Live Formation QR Code Dialog & High-Res PNG Download */}
        <RideQrDialog
          open={showQrModal}
          onOpenChange={setShowQrModal}
          rideTitle={ride.title}
          rideCode={ride.code}
          startLocation={ride.startLocation}
          destination={ride.destination}
        />
      </div>
    </AdminShell>
  );
}
