"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellRing,
  Bike,
  Camera,
  ChevronDown,
  ChevronUp,
  Compass,
  Crown,
  Gauge,
  Hash,
  LogOut,
  Map as MapIcon,
  MapPin,
  Navigation,
  Phone,
  QrCode,
  Radio,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Volume2,
  X
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RideQrDialog } from "@/components/live-ride/ride-qr-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useLiveTracking } from "@/hooks/use-live-tracking";
import {
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
  getPublicLiveRide,
  joinLiveRide,
  leaveLiveRide,
  sendRiderBroadcastMessage,
  updateRiderProfile
} from "@/services/live-ride.service";
import type { BroadcastMessagePriority, Participant } from "@/types/live-ride";

// Dynamic import of Leaflet tactical map (read-only for squad riders)
const TacticalMap = dynamic(
  () => import("@/components/live-ride/tactical-map").then((mod) => mod.TacticalMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] bg-[#0c0c0c] flex items-center justify-center border border-[#442b2a] rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-[#ff535b] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-[#a3908a] uppercase tracking-wider">
            Acquiring Squad Radar Grid...
          </span>
        </div>
      </div>
    )
  }
);

const DEFAULT_QUICK_MESSAGES = [
  "🛑 Regroup at fuel station",
  "➡️ Take right fork/bypass",
  "⬅️ Take left fork",
  "⚠️ Hazard ahead: reduce speed",
  "⏸️ 5-min break",
  "🚀 Moving out in 2 min",
  "🚨 Pull over on shoulder"
];

const DEFAULT_RIDER_QUICK_MESSAGES = [
  "👍 All good / In formation",
  "⛽ Need fuel stop soon",
  "⏸️ Pulling over briefly — wait up",
  "⚠️ Hazard / obstacle on road ahead",
  "🐢 Slowing down / traffic ahead",
  "🚨 Need assistance / mechanical issue"
];

function normalizePhone(p: string | undefined | null): string {
  if (!p) return "";
  return p.replace(/[^0-9]/g, "").trim();
}

function normalizeBikePlate(plate: string | undefined | null): string {
  if (!plate) return "";
  return plate.replace(/[\s\-_]/g, "").toUpperCase().trim();
}

function normalizeName(name: string | undefined | null): string {
  if (!name) return "";
  return name.trim().toLowerCase();
}

export default function RiderLiveRidePage() {
  const { id: rawCode } = useParams<{ id: string }>();
  const code = (rawCode || "").toUpperCase();
  const router = useRouter();

  const [isPillion, setIsPillion] = useState(false);
  const [pillionRiderName, setPillionRiderName] = useState("");
  const [selectedPilotBikeKey, setSelectedPilotBikeKey] = useState("");
  const [riderName, setRiderName] = useState("");
  const [bikeModel, setBikeModel] = useState("");
  const [bikeNumber, setBikeNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [myProfileImageUrl, setMyProfileImageUrl] = useState<string>("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionStatus>("default");
  const [showRiderQr, setShowRiderQr] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Broadcast & Squad Chat messaging state
  const [customBroadcastText, setCustomBroadcastText] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState<BroadcastMessagePriority>("normal");
  const [riderTargetId, setRiderTargetId] = useState<string>("all");
  const [showQuickChips, setShowQuickChips] = useState(true);
  const [dismissedBroadcastId, setDismissedBroadcastId] = useState<string | null>(null);
  const [showCommsLog, setShowCommsLog] = useState(true);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [cockpitView, setCockpitView] = useState<"map" | "gauge">("map");
  const [selectedRadarRiderId, setSelectedRadarRiderId] = useState<string | null>(null);

  const tracking = useLiveTracking();

  useEffect(() => {
    setNotifPermission(getNotificationPermissionStatus());
    void registerServiceWorker();
  }, []);

  async function handleEnableNotifications() {
    const perm = await requestBrowserNotificationPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      toast.success("Live radar push alerts enabled!");
    } else if (perm === "denied") {
      toast.error("Notifications blocked in browser. Please allow them in site settings.");
    } else if (perm === "unsupported") {
      if (isIOS() && !isStandalonePWA()) {
        setShowIosGuide(true);
      } else {
        toast.info("Audio chimes and tactile alerts active for your screen.");
      }
    }
  }

  // Restore saved session from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined" || !code) return;
    try {
      const saved = localStorage.getItem(`ror_live_session_${code}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.participantId) {
          setParticipantId(parsed.participantId);
          if (parsed.riderName) setRiderName(parsed.riderName);
          if (parsed.bikeModel) setBikeModel(parsed.bikeModel);
          if (parsed.bikeNumber) setBikeNumber(parsed.bikeNumber);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.profileImage) setMyProfileImageUrl(parsed.profileImage);
          if (parsed.isPillion) setIsPillion(Boolean(parsed.isPillion));
          if (parsed.pillionRiderName) setPillionRiderName(parsed.pillionRiderName);
          // Auto resume live tracking
          void tracking.startTracking(code, parsed.participantId);
        }
      }
    } catch (e) {
      console.warn("Failed to load saved live ride session:", e);
    }
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear session if ejected by admin
  useEffect(() => {
    if (tracking.ejected && typeof window !== "undefined" && code) {
      try {
        localStorage.removeItem(`ror_live_session_${code}`);
      } catch {}
    }
  }, [tracking.ejected, code]);

  // Query ride session details
  const { data: ride, isLoading, isError, error } = useQuery({
    queryKey: ["public-live-ride", code],
    queryFn: () => getPublicLiveRide(code),
    enabled: Boolean(code),
    refetchInterval: participantId ? false : 5000 // Poll session state until joined
  });

  const joinMutation = useMutation({
    mutationFn: () => {
      const cleanRiderName = riderName.trim();
      const cleanBikeModel = bikeModel.trim();
      const cleanBikeNumber = bikeNumber.trim() ? bikeNumber.trim().toUpperCase() : undefined;
      const cleanPhone = phone.trim() || undefined;
      const cleanPillionRider = pillionRiderName.trim() || undefined;

      // Auto-detect existing registered squad profile if reconnecting
      const squad = ride?.registeredBikes || [];
      const matchedExisting = squad.find((b) => {
        const normN = normalizeName(cleanRiderName);
        const normB = cleanBikeNumber ? normalizeBikePlate(cleanBikeNumber) : "";
        const isNameMatch = normalizeName(b.riderName) === normN;
        const isPlateMatch = normB && normalizeBikePlate(b.bikeNumber) === normB;
        return isNameMatch && (isPlateMatch || !normB);
      });
      const resolvedParticipantId = matchedExisting?.participantId || participantId || undefined;

      if (profileImageFile) {
        const formData = new FormData();
        if (resolvedParticipantId) formData.append("participantId", resolvedParticipantId);
        formData.append("riderName", cleanRiderName);
        formData.append("bikeModel", cleanBikeModel);
        if (cleanBikeNumber) formData.append("bikeNumber", cleanBikeNumber);
        if (cleanPhone) formData.append("phone", cleanPhone);
        formData.append("isPillion", isPillion ? "true" : "false");
        formData.append("role", isPillion ? "pillion" : "rider");
        if (cleanPillionRider) formData.append("pillionRiderName", cleanPillionRider);
        formData.append("profileImage", profileImageFile);
        return joinLiveRide(code, formData);
      }
      return joinLiveRide(code, {
        participantId: resolvedParticipantId,
        riderName: cleanRiderName,
        bikeModel: cleanBikeModel,
        bikeNumber: cleanBikeNumber,
        phone: cleanPhone,
        isPillion,
        role: isPillion ? "pillion" : "rider",
        pillionRiderName: cleanPillionRider
      });
    },
    onSuccess: (data) => {
      setParticipantId(data.participantId);
      const profileImg = data.participant?.profileImage || "";
      if (profileImg) {
        setMyProfileImageUrl(profileImg);
      }
      const resolvedIsPillion = Boolean(
        data.participant?.isPillion || data.participant?.role === "pillion" || isPillion
      );
      if (resolvedIsPillion) setIsPillion(true);
      const resolvedPillionRiderName = data.participant?.pillionRiderName || pillionRiderName.trim();
      if (resolvedPillionRiderName) setPillionRiderName(resolvedPillionRiderName);

      try {
        localStorage.setItem(
          `ror_live_session_${code}`,
          JSON.stringify({
            participantId: data.participantId,
            riderName: data.participant?.riderName || riderName.trim(),
            bikeModel: data.participant?.bikeModel || bikeModel.trim(),
            bikeNumber: data.participant?.bikeNumber || bikeNumber.trim(),
            phone: data.participant?.phone || phone.trim(),
            profileImage: profileImg,
            isPillion: resolvedIsPillion,
            pillionRiderName: resolvedPillionRiderName
          })
        );
      } catch (e) {
        console.warn("Failed to save session to localStorage:", e);
      }
      toast.success(
        data.reconnected
          ? "Reconnected to live formation!"
          : resolvedIsPillion
          ? "Joined ride squad as Pillion passenger!"
          : "Joined ride squad!"
      );
      void tracking.startTracking(code, data.participantId);
    },
    onError: (err) => toast.error(apiErrorMessage(err))
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveLiveRide(code, participantId!),
    onSuccess: () => {
      tracking.stopTracking(true);
      setParticipantId(null);
      try {
        localStorage.removeItem(`ror_live_session_${code}`);
      } catch {}
      toast.info("You left the live tracking session");
      router.push("/");
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
      priority?: BroadcastMessagePriority;
      targetParticipantId?: string;
    }) =>
      sendRiderBroadcastMessage(code, {
        participantId: participantId!,
        text,
        priority,
        targetParticipantId: targetParticipantId && targetParticipantId !== "all" ? targetParticipantId : undefined
      }),
    onSuccess: (newMsg) => {
      tracking.appendLocalMessage(newMsg);
      toast.success(
        newMsg.targetRiderName
          ? `Direct message sent to ${newMsg.targetRiderName}!`
          : "Message transmitted to all squad riders!"
      );
      setCustomBroadcastText("");
    },
    onError: (err) => toast.error(apiErrorMessage(err))
  });

  const profileUpdateMutation = useMutation({
    mutationFn: async () => {
      if (!participantId) throw new Error("Missing rider session");
      const formData = new FormData();
      formData.append("participantId", participantId);
      formData.append("riderName", riderName.trim());
      formData.append("bikeModel", bikeModel.trim());
      formData.append("bikeNumber", bikeNumber.trim().toUpperCase());
      formData.append("phone", phone.trim());
      formData.append("isPillion", String(isPillion));
      formData.append("pillionRiderName", pillionRiderName.trim());
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }
      return updateRiderProfile(code, formData);
    },
    onSuccess: (res) => {
      const updated = res.participant;
      if (updated.riderName) setRiderName(updated.riderName);
      if (updated.bikeModel) setBikeModel(updated.bikeModel);
      if (updated.bikeNumber) setBikeNumber(updated.bikeNumber);
      if (updated.phone) setPhone(updated.phone);
      if (updated.profileImage) {
        setMyProfileImageUrl(updated.profileImage);
      }
      setProfileImageFile(null);
      setShowProfileModal(false);
      try {
        localStorage.setItem(
          `ror_live_session_${code}`,
          JSON.stringify({
            participantId,
            riderName: updated.riderName || riderName.trim(),
            bikeModel: updated.bikeModel || bikeModel.trim(),
            bikeNumber: updated.bikeNumber || bikeNumber.trim(),
            phone: updated.phone || phone.trim(),
            profileImage: updated.profileImage || myProfileImageUrl,
            isPillion: Boolean(updated.isPillion),
            pillionRiderName: updated.pillionRiderName || pillionRiderName.trim()
          })
        );
      } catch {}
      toast.success("Your rider profile has been updated!");
    },
    onError: (err) => toast.error(apiErrorMessage(err))
  });

  const displayPhoto = profileImagePreview || myProfileImageUrl;

  // Assemble real-time squad participants from live tracking pings and initial ride data (memoized to prevent map canvas re-renders)
  const squadParticipants: Participant[] = useMemo(() => {
    const rawSquad = tracking.participants?.length
      ? tracking.participants
      : (ride?.participants || []);

    const list: Participant[] = rawSquad.map((p) => {
      if (p._id === participantId) {
        return {
          ...p,
          riderName: riderName || p.riderName,
          bikeModel: bikeModel || p.bikeModel,
          bikeNumber: bikeNumber || p.bikeNumber,
          profileImage: displayPhoto || p.profileImage,
          latitude: tracking.latitude || p.latitude || 30.3165,
          longitude: tracking.longitude || p.longitude || 78.0322,
          speed: tracking.latitude ? tracking.speed : p.speed || 0,
          heading: tracking.latitude ? tracking.heading : p.heading || 0,
          accuracy: tracking.latitude ? tracking.accuracy : p.accuracy || 0,
          role: tracking.role || p.role,
          lastPingAt: new Date().toISOString()
        };
      }
      return p;
    });

    if (participantId && !list.some((p) => p._id === participantId)) {
      list.push({
        _id: participantId,
        riderName: riderName || "You",
        phone: phone || "",
        bikeModel: bikeModel || "Motorcycle",
        bikeNumber: bikeNumber || "",
        latitude: tracking.latitude || 30.3165,
        longitude: tracking.longitude || 78.0322,
        speed: tracking.speed || 0,
        heading: tracking.heading || 0,
        accuracy: tracking.accuracy || 0,
        role: tracking.role || (isPillion ? "pillion" : "rider"),
        isPillion,
        pillionRiderName,
        status: "active",
        profileImage: displayPhoto,
        lastPingAt: new Date().toISOString(),
        joinedAt: new Date().toISOString()
      });
    }
    return list;
  }, [
    tracking.participants,
    tracking.latitude,
    tracking.longitude,
    tracking.speed,
    tracking.heading,
    tracking.accuracy,
    tracking.role,
    ride?.participants,
    participantId,
    riderName,
    phone,
    bikeModel,
    bikeNumber,
    isPillion,
    pillionRiderName,
    displayPhoto
  ]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#070707] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-[#ff535b] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ffdad8]">Connecting to Command Uplink...</p>
        </div>
      </main>
    );
  }

  if (isError || !ride) {
    return (
      <main className="min-h-screen bg-[#070707] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center border-[#5b2828] bg-[#121212]">
          <AlertTriangle className="h-12 w-12 text-[#ff535b] mx-auto mb-4" />
          <h1 className="font-display text-3xl text-[#ffdad8]">Session Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">{apiErrorMessage(error) || "This live ride link is invalid or expired."}</p>
          <Button asChild className="mt-6 w-full" variant="outline">
            <Link href="/">Return to Headquarters</Link>
          </Button>
        </Card>
      </main>
    );
  }

  // Handle case where Admin ejected this specific rider
  if (tracking.ejected) {
    const handleRejoinFresh = () => {
      try {
        localStorage.removeItem(`ror_live_session_${code}`);
      } catch {}
      setParticipantId(null);
      window.location.reload();
    };

    return (
      <main className="min-h-screen bg-[#070707] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center border-red-600 bg-[#160c0c] rebel-scan">
          <ShieldAlert className="h-14 w-14 text-red-500 mx-auto mb-4 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-red-400">Transmission Terminated</span>
          <h1 className="font-display text-3xl text-white mt-1">Disconnected by Admin</h1>
          <p className="mt-3 text-sm text-[#d4b5b5] leading-relaxed">
            You have been removed from this live tracking formation by the Road Captain / Admin.
          </p>
          <div className="mt-4 p-3 bg-black/60 border border-red-900/50 rounded text-xs font-mono text-red-300">
            ✓ Background GPS Listener Stopped<br />
            ✓ Battery Keep-Alive Freed
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              type="button"
              onClick={handleRejoinFresh}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase font-bold cursor-pointer"
            >
              Join Again with New Details
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  // Handle case where Admin ended the entire ride session
  if (ride.status === "completed" || tracking.completed) {
    return (
      <main className="min-h-screen bg-[#070707] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center border-[#442b2a] bg-[#121212]">
          <ShieldCheck className="h-12 w-12 text-[#ff535b] mx-auto mb-4" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ffb3b1]">Formation Dismissed</span>
          <h1 className="font-display text-3xl text-[#ffdad8] mt-1">Ride Ended</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The Road Captain has officially concluded &ldquo;{ride.title}&rdquo;. Thank you for riding with discipline.
          </p>
          <Button asChild className="mt-6 w-full" variant="outline">
            <Link href="/">Return to Headquarters</Link>
          </Button>
        </Card>
      </main>
    );
  }

  // ACTIVE TRANSMISSION COCKPIT HUD
  if (participantId) {
    const quickList = tracking.quickMessages?.length
      ? tracking.quickMessages
      : ride.quickMessages?.length
      ? ride.quickMessages
      : DEFAULT_QUICK_MESSAGES;

    const messageList = tracking.messages?.length ? tracking.messages : ride.messages || [];

    // Filter out dismissed sticky banner
    const activeBroadcast =
      tracking.latestBroadcast &&
      (tracking.latestBroadcast._id || tracking.latestBroadcast.sentAt) !== dismissedBroadcastId
        ? tracking.latestBroadcast
        : null;

    const isDirectToMe = Boolean(
      activeBroadcast?.targetParticipantId && activeBroadcast.targetParticipantId === participantId
    );

    const isLead = tracking.role === "lead";
    const isMarshal = tracking.role === "marshal";
    const isSweeper = tracking.role === "sweeper";
    const isPillionRole = tracking.role === "pillion" || isPillion;

    const roleColor = isLead
      ? "#ffd700"
      : isMarshal
      ? "#00f0ff"
      : isSweeper
      ? "#a855f7"
      : isPillionRole
      ? "#f97316"
      : "#ff535b";

    const roleLabel = isLead
      ? "Road Captain"
      : isMarshal
      ? "Marshal"
      : isSweeper
      ? "Sweeper"
      : isPillionRole
      ? "Pillion"
      : "Squad Rider";

    const isMarshalOrLead = isMarshal || isLead;
    const squadCountVisible = isMarshalOrLead || tracking.showRiderCountToSquad || Boolean(ride.showRiderCountToSquad);
    const displayRiderCount = tracking.activeParticipantsCount ?? ride.activeParticipantsCount ?? null;

    return (
      <main className="min-h-screen bg-[#070707] text-[#e5e2e1] px-2.5 py-3 sm:px-4 sm:py-5 flex flex-col justify-between max-w-xl mx-auto space-y-3">
        {/* Compact Tactical HUD Header */}
        <header className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#2d1b1b]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="relative group shrink-0 cursor-pointer"
              title="Edit Rider Profile"
            >
              {displayPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayPhoto}
                  alt={riderName}
                  className="w-8 h-8 rounded-full object-cover border-2 shrink-0 shadow-md group-hover:opacity-85 transition"
                  style={{ borderColor: roleColor }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-black shrink-0 shadow-md group-hover:opacity-85 transition"
                  style={{ backgroundColor: roleColor }}
                >
                  {(riderName[0] || "R").toUpperCase()}
                </div>
              )}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-bold text-sm text-white truncate max-w-[110px] sm:max-w-[160px]">{riderName}</h2>
                <span
                  className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border"
                  style={{ borderColor: `${roleColor}60`, color: roleColor, backgroundColor: `${roleColor}15` }}
                >
                  {roleLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-[#1b1111] hover:bg-[#2a1a1a] text-purple-300 border border-purple-500/40 rounded transition cursor-pointer"
                  title="Update your name, photo, bike, or plate"
                >
                  ✏️ Profile
                </button>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground truncate">
                {bikeModel} {bikeNumber ? `· ${bikeNumber}` : ""}
                {pillionRiderName ? ` · with ${pillionRiderName}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#140e0e] border border-[#3e2424]">
              <button
                type="button"
                onClick={() => setCockpitView("map")}
                className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1 ${
                  cockpitView === "map"
                    ? "bg-[#ff535b] text-white shadow-sm"
                    : "text-[#a3908a] hover:text-white"
                }`}
                aria-label="Switch to Tactical Radar Map"
              >
                <MapIcon className="h-3 w-3" />
                <span className="hidden xs:inline">Radar</span>
              </button>
              <button
                type="button"
                onClick={() => setCockpitView("gauge")}
                className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1 ${
                  cockpitView === "gauge"
                    ? "bg-[#ff535b] text-white shadow-sm"
                    : "text-[#a3908a] hover:text-white"
                }`}
                aria-label="Switch to Speedometer HUD"
              >
                <Gauge className="h-3 w-3" />
                <span className="hidden xs:inline">HUD</span>
              </button>
            </div>

            {/* Squad Count Pill */}
            {squadCountVisible && displayRiderCount !== null ? (
              <span className="font-mono text-[10px] text-[#ffdad8] bg-[#221313] px-2 py-1 rounded-lg border border-[#552e2e] hidden sm:flex items-center gap-1 font-bold">
                <Users className="h-3 w-3 text-[#ff535b]" />
                <span>{displayRiderCount}</span>
              </span>
            ) : null}

            {/* Ride Code & QR Modal Button */}
            <button
              type="button"
              onClick={() => setShowRiderQr(true)}
              className="h-7 px-2 rounded-lg bg-[#140e0e] hover:bg-[#201414] border border-[#3e2424] hover:border-[#ff535b] text-[#ffdad8] font-mono text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="View Ride QR Code"
            >
              <QrCode className="h-3 w-3 text-[#ff535b]" />
              <span>{ride.code}</span>
            </button>
          </div>
        </header>

        {/* Browser Notification Permission Banner */}
        {notifPermission === "default" && (
          <div className="bg-[#1a1410] border border-amber-500/50 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 font-mono text-xs shadow-lg">
            <div className="flex items-center gap-2 min-w-0">
              <BellRing className="h-4 w-4 text-amber-400 shrink-0 animate-bounce" />
              <div className="truncate">
                <span className="font-bold uppercase text-[10px] text-amber-300 block">Live Audio & Push Alerts</span>
                <span className="text-[10px] text-[#cfbeb6] truncate block">Directions & marshal chimes</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleEnableNotifications}
              className="font-mono text-[10px] uppercase bg-amber-600 hover:bg-amber-500 text-black font-bold h-7 px-2.5 shrink-0 shadow cursor-pointer"
            >
              Allow
            </Button>
          </div>
        )}

        {/* GPS Warning or Telemetry Error Alert Banner */}
        {tracking.error && (
          <div className="bg-[#24170e] border border-amber-500/60 rounded-xl p-2.5 flex items-center gap-2 font-mono text-xs text-amber-300 animate-pulse">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <div className="min-w-0 flex-1">
              <span className="font-bold uppercase text-[10px] block">Location Warning</span>
              <span className="text-[11px]">{tracking.error}</span>
            </div>
          </div>
        )}

        {/* TOP BROADCAST / DIRECT WHISPER ALERT BANNER */}
        {activeBroadcast && (
          <div
            className={`rounded-xl p-3 border-2 transition-all animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl ${
              isDirectToMe
                ? "bg-[#251b0d] border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.35)]"
                : activeBroadcast.priority === "urgent"
                ? "bg-[#250d0d] border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.3)] animate-pulse"
                : activeBroadcast.priority === "direction"
                ? "bg-[#091f29] border-[#00f0ff] shadow-[0_0_25px_rgba(0,240,255,0.25)]"
                : "bg-[#191512] border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {isDirectToMe ? (
                  <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-400 flex items-center gap-1 animate-pulse">
                    <Crown className="h-3 w-3 text-amber-400" /> DIRECT ORDER
                  </span>
                ) : activeBroadcast.senderRole === "lead" ? (
                  <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1">
                    <Crown className="h-3 w-3 text-[#ffd700]" /> Road Captain
                  </span>
                ) : activeBroadcast.senderRole === "marshal" ? (
                  <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 flex items-center gap-1">
                    <Compass className="h-3 w-3 text-[#00f0ff]" /> Direction Marshal
                  </span>
                ) : activeBroadcast.senderRole === "admin" ? (
                  <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/50 flex items-center gap-1">
                    <Radio className="h-3 w-3 text-[#ff535b]" /> Command HQ
                  </span>
                ) : (
                  <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                    <Radio className="h-3 w-3 text-emerald-400" /> Squad Rider
                  </span>
                )}
                <span className="font-mono text-xs text-white font-semibold truncate max-w-[120px]">
                  {activeBroadcast.senderName}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {new Date(activeBroadcast.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setDismissedBroadcastId(activeBroadcast._id || activeBroadcast.sentAt)}
                className="text-muted-foreground hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
                aria-label="Dismiss alert"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-1.5 text-sm sm:text-base font-bold text-white tracking-wide flex items-start gap-2">
              {isDirectToMe ? (
                <Radio className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 animate-ping" />
              ) : activeBroadcast.priority === "urgent" ? (
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              ) : activeBroadcast.priority === "direction" ? (
                <Compass className="h-4 w-4 text-[#00f0ff] shrink-0 mt-0.5" />
              ) : (
                <Radio className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <p className={`leading-snug break-words flex-1 ${isDirectToMe ? "text-amber-100" : ""}`}>
                {activeBroadcast.text}
              </p>
            </div>
          </div>
        )}

        {/* Center Cockpit Readouts */}
        <div className="space-y-3">
          {cockpitView === "map" ? (
            <div className="space-y-2.5">
              {/* Tactical Radar Map (Read-Only Convoy View) */}
              <div className="h-[54vh] min-h-[360px] max-h-[600px] sm:h-[460px] w-full rounded-2xl overflow-hidden border border-[#3e2424] shadow-2xl relative">
                <TacticalMap
                  participants={squadParticipants}
                  selectedParticipantId={selectedRadarRiderId || participantId}
                  onSelectParticipant={(id) => setSelectedRadarRiderId(id)}
                  onPickMyLocation={(lat, lng) => {
                    tracking.setManualLocation(lat, lng);
                    toast.success(`📌 Exact rider location pinned to ${lat}, ${lng}!`);
                  }}
                  onRefreshExactGps={() => {
                    tracking.refreshExactGps();
                    toast.info("🎯 Refreshing high-accuracy satellite GPS...");
                  }}
                  readOnly={true}
                  clockOffset={tracking.clockOffset}
                  myParticipantId={participantId}
                />
              </div>

              {/* Minimal 3-Column Telemetry Strip Under Radar Map */}
              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                {/* SPEED */}
                <div className="bg-[#100c0c] border border-[#3e2424] py-2 px-1.5 rounded-xl shadow-lg flex flex-col justify-center">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-semibold">SPEED</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <strong className="text-xl sm:text-2xl font-display text-[#ff535b] tracking-tight">{tracking.speed}</strong>
                    <span className="text-[10px] text-[#ffb3b1] font-bold">km/h</span>
                  </div>
                </div>

                {/* HEADING */}
                <div className="bg-[#100c0c] border border-[#3e2424] py-2 px-1.5 rounded-xl shadow-lg flex flex-col justify-center">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-semibold">HEADING</span>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 text-white transition-transform duration-300"
                      style={{ transform: `rotate(${tracking.heading}deg)` }}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L19 21L12 17L5 21L12 2Z" />
                    </svg>
                    <strong className="text-base sm:text-lg font-bold text-white">{tracking.heading}°</strong>
                  </div>
                </div>

                {/* GPS ACCURACY */}
                <div className="bg-[#100c0c] border border-[#3e2424] py-2 px-1.5 rounded-xl shadow-lg flex flex-col justify-center">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-semibold">GPS FIX</span>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <strong className="text-base sm:text-lg font-bold text-emerald-400">±{tracking.accuracy}m</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Speedometer Circle */}
              <div className="relative mx-auto w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-[#331c1c] flex flex-col items-center justify-center bg-[#110d0d] shadow-[0_0_40px_rgba(255,83,91,0.15)] rebel-scan">
                <Gauge className="h-5 w-5 text-[#ff535b] absolute top-4 sm:top-5" />
                <span className="font-display text-5xl sm:text-7xl text-white tracking-tight">{tracking.speed}</span>
                <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#ffb3b1]">KM / H</span>
              </div>

              {/* Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 font-mono">
                <div className="bg-[#121010] border border-[#3e2424] p-3 rounded-lg flex items-center gap-3">
                  <Compass className="h-5 w-5 text-[#ff535b] shrink-0" />
                  <div className="truncate">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">HEADING</span>
                    <strong className="text-sm text-white">{tracking.heading}°</strong>
                  </div>
                </div>

                <div className="bg-[#121010] border border-[#3e2424] p-3 rounded-lg flex items-center gap-3">
                  <Navigation className="h-5 w-5 text-[#ff535b] shrink-0" />
                  <div className="truncate">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">GPS ACCURACY</span>
                    <strong className="text-sm text-white">±{tracking.accuracy}m</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UNIFIED SQUAD LIVE COMMS & CHAT DESK (For All Riders, Marshals & Captain) */}
          <Card className="p-3.5 sm:p-4 border-[#1c3e4a] bg-[#0c171c]/95 rounded-xl shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1c3e4a] pb-2.5 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <h3 className="font-display text-base sm:text-lg text-white tracking-wide flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-[#00f0ff]" />
                  {tracking.role === "lead"
                    ? "Captain Tactical Comms"
                    : tracking.role === "marshal"
                    ? "Marshal Comms Desk"
                    : "Squad Live Radio & Chat"}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowQuickChips(!showQuickChips)}
                  className="text-[10px] font-mono uppercase bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 px-2 py-0.5 rounded transition cursor-pointer"
                >
                  {showQuickChips ? "Hide Presets" : "1-Tap Presets"}
                </button>
                <span className="text-[9px] font-mono uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  All Riders Live
                </span>
              </div>
            </div>

            {/* Target Recipient Selector (All Squad vs Direct Whisper) */}
            <div className="flex items-center justify-between gap-2 bg-[#091318] border border-[#1c3e4a] rounded-lg px-2.5 py-1.5 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-[#8ab8c7] shrink-0">Send To:</span>
              <select
                value={riderTargetId}
                onChange={(e) => setRiderTargetId(e.target.value)}
                aria-label="Message Recipient"
                className="flex-1 bg-transparent text-xs font-mono text-white outline-none cursor-pointer truncate font-semibold"
              >
                <option value="all" className="bg-[#0b161c] text-white">
                  👥 Entire Formation (Shown to All Riders & Admin)
                </option>
                {squadParticipants
                  .filter((p) => p._id !== participantId && p.status !== "ejected" && p.status !== "left")
                  .map((p) => (
                    <option key={p._id} value={p._id} className="bg-[#0b161c] text-white">
                      🎯 Direct Whisper: {p.riderName} ({p.role === "lead" ? "Captain" : p.role === "marshal" ? "Marshal" : p.bikeModel})
                    </option>
                  ))}
              </select>
              {riderTargetId !== "all" && (
                <button
                  type="button"
                  onClick={() => setRiderTargetId("all")}
                  className="text-[10px] text-amber-400 hover:text-white underline shrink-0 cursor-pointer"
                >
                  Reset to All
                </button>
              )}
            </div>

            {/* 1-Tap Quick Action Buttons Grid (Shown for ALL riders) */}
            {showQuickChips && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono text-[#8ab8c7] uppercase tracking-wider">
                  1-Tap Instant Transmit ({riderTargetId === "all" ? "Broadcasts to All Riders" : "Direct Whisper"}):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                  {(isMarshalOrLead ? quickList : DEFAULT_RIDER_QUICK_MESSAGES).map((msg, idx) => {
                    const autoPriority: BroadcastMessagePriority =
                      msg.includes("🚨") || msg.includes("⚠️") || msg.includes("🛑")
                        ? "urgent"
                        : msg.includes("➡️") || msg.includes("⬅️")
                        ? "direction"
                        : "normal";
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={broadcastMutation.isPending}
                        onClick={() =>
                          broadcastMutation.mutate({
                            text: msg,
                            priority: autoPriority,
                            targetParticipantId: riderTargetId
                          })
                        }
                        className="text-left p-2 rounded-lg bg-[#11232c] hover:bg-[#183442] active:scale-[0.98] border border-[#234c5c] hover:border-[#00f0ff] text-xs text-[#dff7fd] font-mono transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate pr-2 font-medium">{msg}</span>
                        <Send className="h-3 w-3 text-[#00f0ff] opacity-70 group-hover:opacity-100 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Message Composer */}
            <div className="pt-2 border-t border-[#1c3e4a] space-y-2">
              <div className="flex gap-2">
                <Input
                  value={customBroadcastText}
                  onChange={(e) => setCustomBroadcastText(e.target.value)}
                  placeholder={
                    riderTargetId === "all"
                      ? "Write message to all riders & captain... (Enter ↵)"
                      : "Write direct message to selected rider... (Enter ↵)"
                  }
                  className="h-10 sm:h-11 text-xs bg-[#0f1d24] border-[#224452] text-white font-mono placeholder:text-muted-foreground focus:border-[#00f0ff]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customBroadcastText.trim()) {
                      e.preventDefault();
                      broadcastMutation.mutate({
                        text: customBroadcastText.trim(),
                        priority: broadcastPriority,
                        targetParticipantId: riderTargetId
                      });
                    }
                  }}
                />
                <Button
                  size="sm"
                  disabled={broadcastMutation.isPending || !customBroadcastText.trim()}
                  onClick={() =>
                    broadcastMutation.mutate({
                      text: customBroadcastText.trim(),
                      priority: broadcastPriority,
                      targetParticipantId: riderTargetId
                    })
                  }
                  className="h-10 sm:h-11 px-3 sm:px-4 bg-[#00f0ff] hover:bg-[#00d0e0] text-[#051a22] font-mono text-xs uppercase font-bold tracking-wider shrink-0 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                >
                  {broadcastMutation.isPending ? (
                    <div className="h-4 w-4 border-2 border-[#051a22] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1" /> Send
                    </>
                  )}
                </Button>
              </div>

              {/* Priority Picker */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-muted-foreground uppercase">Message Type:</span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {(["normal", "direction", "urgent"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBroadcastPriority(p)}
                      className={`px-2 py-0.5 rounded uppercase font-mono cursor-pointer transition ${
                        broadcastPriority === p
                          ? p === "urgent"
                            ? "bg-red-500/30 text-red-300 border border-red-500 font-bold"
                            : p === "direction"
                            ? "bg-[#00f0ff]/30 text-[#00f0ff] border border-[#00f0ff] font-bold"
                            : "bg-emerald-500/30 text-emerald-200 border border-emerald-400 font-bold"
                          : "text-muted-foreground hover:text-white"
                      }`}
                    >
                      {p === "normal" ? "💬 Squad Chat" : p === "direction" ? "🧭 Route/Info" : "🚨 Urgent/SOS"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* LIVE SQUAD COMMS FEED (Shows All Riders, Marshals, Captain & Admin Messages) */}
            <div className="bg-[#091216] border border-[#1c3e4a] rounded-xl overflow-hidden font-mono text-xs">
              <button
                type="button"
                onClick={() => setShowCommsLog(!showCommsLog)}
                className="w-full p-2.5 flex items-center justify-between text-left hover:bg-[#0e1b22] transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-[#00f0ff]" />
                  <span className="font-bold text-[#dff7fd] uppercase tracking-wider text-[11px]">
                    Live Squad Messages ({messageList.length})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                  <span>{showCommsLog ? "Collapse" : "Show Messages"}</span>
                  {showCommsLog ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>
              </button>

              {showCommsLog && (
                <div className="p-2.5 pt-1 border-t border-[#162d38] space-y-2 max-h-64 overflow-y-auto">
                  {messageList.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-4">
                      No messages yet. Send a message above or tap a preset chip to broadcast to all riders!
                    </p>
                  ) : (
                    [...messageList].reverse().map((msg, idx) => {
                      const isFromMe = Boolean(
                        msg.senderParticipantId && String(msg.senderParticipantId) === String(participantId)
                      );
                      return (
                        <div
                          key={msg._id || idx}
                          className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                            msg.targetParticipantId === participantId
                              ? "bg-amber-950/40 border-amber-500/50 text-amber-200"
                              : isFromMe
                              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-100"
                              : msg.priority === "urgent"
                              ? "bg-red-950/30 border-red-600/40 text-red-200"
                              : msg.priority === "direction"
                              ? "bg-[#091b24] border-[#00f0ff]/30 text-[#d3f4fc]"
                              : "bg-[#121c22] border-[#223944] text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] gap-1 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {msg.targetParticipantId === participantId ? (
                                <span className="text-amber-300 font-bold flex items-center gap-0.5 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-400/40">
                                  🎯 Whisper For You
                                </span>
                              ) : msg.targetRiderName ? (
                                <span className="text-amber-300 font-bold flex items-center gap-0.5 bg-amber-500/15 px-1.5 py-0.5 rounded">
                                  🎯 To {msg.targetRiderName}
                                </span>
                              ) : null}

                              {msg.senderRole === "lead" ? (
                                <span className="text-amber-300 font-bold flex items-center gap-0.5">
                                  <Crown className="h-2.5 w-2.5 text-[#ffd700]" /> Captain
                                </span>
                              ) : msg.senderRole === "marshal" ? (
                                <span className="text-[#00f0ff] font-bold flex items-center gap-0.5">
                                  <Compass className="h-2.5 w-2.5 text-[#00f0ff]" /> Marshal
                                </span>
                              ) : msg.senderRole === "admin" ? (
                                <span className="text-[#ff535b] font-bold flex items-center gap-0.5">
                                  <Radio className="h-2.5 w-2.5 text-[#ff535b]" /> Admin
                                </span>
                              ) : msg.senderRole === "sweeper" ? (
                                <span className="text-purple-300 font-bold flex items-center gap-0.5">
                                  🧹 Sweeper
                                </span>
                              ) : msg.senderRole === "pillion" ? (
                                <span className="text-orange-300 font-bold flex items-center gap-0.5">
                                  🪖 Pillion
                                </span>
                              ) : (
                                <span className="text-emerald-300 font-bold flex items-center gap-0.5">
                                  🏍️ Rider
                                </span>
                              )}

                              <span className="font-semibold text-white">
                                {msg.senderName} {isFromMe ? "(You)" : ""}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isFromMe && msg.senderParticipantId && (
                                <button
                                  type="button"
                                  onClick={() => setRiderTargetId(String(msg.senderParticipantId))}
                                  className="text-[9px] text-[#00f0ff] hover:underline cursor-pointer"
                                  title={`Reply directly to ${msg.senderName}`}
                                >
                                  ↩️ Reply
                                </button>
                              )}
                              <span className="text-muted-foreground">
                                {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                          <p className="font-sans font-medium text-white break-words">{msg.text}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* System Indicators */}
          <div className="bg-[#151010] border border-[#442b2a] p-3.5 sm:p-4 rounded-xl space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Screen Wake Lock:</span>
              <span className={tracking.wakeLockActive ? "text-emerald-400 font-bold" : "text-amber-400"}>
                {tracking.wakeLockActive ? "ON (Screen Stays Awake)" : "Standard"}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Background Keep-Alive:</span>
              <span className="text-emerald-400 font-bold">RUNNING</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Live Audio & Push Alerts:</span>
              <div className="flex items-center gap-2">
                <span
                  className={
                    notifPermission === "granted"
                      ? "text-emerald-400 font-bold"
                      : notifPermission === "denied"
                      ? "text-red-400 font-bold"
                      : "text-amber-400 font-bold"
                  }
                >
                  {notifPermission === "granted"
                    ? "ACTIVE (Push + Chimes)"
                    : notifPermission === "denied"
                    ? "BLOCKED"
                    : "PENDING"}
                </span>
                {notifPermission !== "granted" ? (
                  <button
                    type="button"
                    onClick={handleEnableNotifications}
                    className="text-[10px] text-amber-300 hover:text-white underline cursor-pointer"
                  >
                    Enable
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => playTacticalAlertChime("direction")}
                    className="text-[10px] text-emerald-300 hover:text-white underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Volume2 className="h-3 w-3" /> Test
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-[#aa958b] leading-relaxed pt-2 border-t border-[#352323]">
              ⚡ You can switch to Google Maps or lock your phone. Keep this browser tab open to continue transmitting your location to the Road Captain.
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <footer className="pt-3 border-t border-[#3e2424]">
          <Button
            variant="destructive"
            className="w-full min-h-[50px] sm:min-h-[54px] h-auto py-3 px-4 font-display text-base sm:text-xl uppercase tracking-wider bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 cursor-pointer flex items-center justify-center gap-2"
            disabled={leaveMutation.isPending}
            onClick={() => setConfirmLeave(true)}
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="truncate">{leaveMutation.isPending ? "Disconnecting..." : "Leave Ride / Stop GPS"}</span>
          </Button>
        </footer>

        {/* Exit Ride Confirmation Modal */}
        <ConfirmDialog
          open={confirmLeave}
          onOpenChange={(open) => setConfirmLeave(open)}
          title="Leave Live Ride Session?"
          description="This will immediately stop transmitting your GPS location to the Road Captain and disconnect you from the formation radar."
          confirmLabel="Exit Ride Now"
          pending={leaveMutation.isPending}
          onConfirm={() => {
            setConfirmLeave(false);
            leaveMutation.mutate();
          }}
        />

        {/* Rider Profile Setup / Edit Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-[#120c0c] border border-[#352323] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#251818] pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#ff535b] block">
                    SQUAD IDENTITY
                  </span>
                  <h3 className="font-display text-2xl uppercase tracking-wide text-white">
                    Edit Your Rider Profile
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="text-[#a3908a] hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Photo Upload & Preview */}
              <div className="flex items-center gap-4 bg-[#1a1111] border border-[#2d1d1d] rounded-xl p-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ff535b] bg-[#2a1515] flex items-center justify-center shrink-0">
                  {displayPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayPhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-2xl text-white">
                      {(riderName[0] || "R").toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <label className="text-xs font-bold text-white block">Profile Photo (Visible on Map)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        setProfileImageFile(file);
                        setProfileImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="block w-full text-xs text-[#a3908a] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:uppercase file:bg-[#ff535b]/20 file:text-[#ff535b] hover:file:bg-[#ff535b]/30 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#a3908a] block mb-1">
                    Rider Name *
                  </label>
                  <Input
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    placeholder="e.g. Aryan Verma"
                    className="bg-[#1b1111] border-[#352323] text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#a3908a] block mb-1">
                      Motorcycle Model *
                    </label>
                    <Input
                      value={bikeModel}
                      onChange={(e) => setBikeModel(e.target.value)}
                      placeholder="e.g. RE Himalayan 450"
                      className="bg-[#1b1111] border-[#352323] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#a3908a] block mb-1">
                      Plate Number
                    </label>
                    <Input
                      value={bikeNumber}
                      onChange={(e) => setBikeNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. UK07AB1234"
                      className="bg-[#1b1111] border-[#352323] text-white uppercase font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[#a3908a] block mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="bg-[#1b1111] border-[#352323] text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#251818]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProfileModal(false)}
                  className="text-xs font-mono uppercase cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={profileUpdateMutation.isPending || !riderName.trim() || !bikeModel.trim()}
                  onClick={() => profileUpdateMutation.mutate()}
                  className="bg-[#ff535b] hover:bg-[#ff535b]/90 text-white font-mono text-xs uppercase tracking-wider cursor-pointer"
                >
                  {profileUpdateMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Ride QR Code Share Modal */}
        <RideQrDialog
          open={showRiderQr}
          onOpenChange={setShowRiderQr}
          rideTitle={ride.title}
          rideCode={ride.code}
          startLocation={ride.startLocation}
          destination={ride.destination}
        />
      </main>
    );
  }

  // Squad formation registered bikes & pilot bikes available for pillion pairing
  const registeredBikes = ride.registeredBikes || [];

  const bikesWithPillion = new Set(
    registeredBikes
      .filter((b) => b.isPillion || b.role === "pillion")
      .map((b) => normalizeBikePlate(b.bikeNumber))
      .filter(Boolean)
  );

  const pilotBikesForPairing = registeredBikes.filter((b) => {
    if (b.isPillion || b.role === "pillion") return false;
    const norm = normalizeBikePlate(b.bikeNumber);
    return norm ? !bikesWithPillion.has(norm) : true;
  });

  const normPhone = normalizePhone(phone);
  const normPlate = normalizeBikePlate(bikeNumber);
  const normName = normalizeName(riderName);

  let phoneWarning: string | null = null;
  if (normPhone.length > 0 && normPhone.length < 10) {
    phoneWarning = "Please enter a valid 10-digit mobile number";
  }

  // Check if user is reconnecting to an existing profile in this squad
  let matchingRegisteredProfile: (typeof registeredBikes)[number] | null = null;
  if (normName.length >= 2) {
    const candidate = registeredBikes.find((b) => {
      const isSameName = normalizeName(b.riderName) === normName;
      if (!isSameName) return false;
      if (normPlate.length >= 3) {
        return normalizeBikePlate(b.bikeNumber) === normPlate;
      }
      return true;
    });
    if (candidate) {
      matchingRegisteredProfile = candidate;
    }
  }

  let bikePlateError: string | null = null;
  let bikePlateNotice: string | null = null;

  if (normPlate.length >= 3) {
    const matchingBikes = registeredBikes.filter(
      (b) => normalizeBikePlate(b.bikeNumber) === normPlate
    );

    if (isPillion) {
      const existingPillion = matchingBikes.find((b) => b.isPillion || b.role === "pillion");
      if (existingPillion) {
        if (normName && normalizeName(existingPillion.riderName) === normName) {
          matchingRegisteredProfile = existingPillion;
          bikePlateNotice = `Existing pillion profile confirmed for ${existingPillion.riderName}. You will be reconnected.`;
        } else {
          bikePlateError = `Bike ${bikeNumber.trim()} already has a registered pillion passenger (${existingPillion.riderName}). A motorcycle can only carry 1 pillion.`;
        }
      } else if (matchingBikes.length >= 2) {
        bikePlateError = `Bike ${bikeNumber.trim()} has reached maximum capacity of 2 riders.`;
      } else if (matchingBikes.length === 1) {
        const pilot = matchingBikes[0];
        bikePlateNotice = `Paired with pilot ${pilot.riderName} (${pilot.bikeModel}).`;
      }
    } else {
      const existingSolo = matchingBikes.find((b) => !b.isPillion && b.role !== "pillion");
      if (existingSolo) {
        if (normName && normalizeName(existingSolo.riderName) === normName) {
          matchingRegisteredProfile = existingSolo;
          bikePlateNotice = `Existing registration confirmed for ${existingSolo.riderName} (${existingSolo.bikeModel}). You will be reconnected.`;
        } else {
          bikePlateError = `Bike plate ${bikeNumber.trim()} is already registered by ${existingSolo.riderName}. Two solo riders cannot share the same bike plate. If riding together, switch to 'Pillion Passenger'.`;
        }
      } else if (matchingBikes.length >= 2) {
        bikePlateError = `Bike ${bikeNumber.trim()} has reached maximum capacity of 2 riders.`;
      }
    }
  }

  let nameWarning: string | null = null;
  if (normName.length >= 2 && !participantId) {
    const existingName = registeredBikes.find(
      (b) => normalizeName(b.riderName) === normName
    );
    if (existingName) {
      if (matchingRegisteredProfile && matchingRegisteredProfile.riderName === existingName.riderName) {
        // Reconnecting to their existing profile, no warning needed
      } else {
        nameWarning = `"${existingName.riderName}" is already in this ride. Please add an initial or nickname (e.g. "${riderName.trim()} S.") to avoid cockpit confusion.`;
      }
    }
  }

  // PRE-JOIN SCREEN
  return (
    <main className="min-h-screen bg-[#070707] text-[#e5e2e1] px-3.5 py-6 sm:px-6 sm:py-10 flex flex-col justify-center items-center">
      <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-6">
        {/* Top Bar: Back Link + Live Code Pill */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-[#ff535b] transition-colors py-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to HQ
          </Link>
          <button
            type="button"
            onClick={() => setShowRiderQr(true)}
            className="font-mono text-[10px] uppercase tracking-widest text-[#ff535b] bg-[#1a0c0c] hover:bg-[#281212] border border-[#552e2e] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 transition cursor-pointer"
            title="Scan / Share Ride QR Code"
          >
            <QrCode className="h-3 w-3 text-[#ff535b]" />
            CODE: {ride.code}
          </button>
        </div>

        {/* Mission Session Header */}
        <div className="text-center space-y-1 sm:space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#552e2e] bg-[#140b0b] font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#ff535b]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff535b] animate-ping" />
            Live Formation Uplink
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide break-words pt-1">
            {ride.title}
          </h1>
          {(ride.startLocation || ride.destination) && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-muted-foreground pt-0.5">
              {ride.startLocation && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#ff535b]" />
                  {ride.startLocation}
                </span>
              )}
              {ride.startLocation && ride.destination && <span className="text-[#ff535b]">→</span>}
              {ride.destination && <span>{ride.destination}</span>}
            </div>
          )}
        </div>

        {/* Identity & Join Card */}
        <Card className="p-4 sm:p-6 border-[#4e2d2c] bg-[#130f0f]/95 rebel-frame rounded-xl shadow-2xl backdrop-blur-sm">
          <div className="border-b border-[#352020] pb-3 sm:pb-4 mb-4 sm:mb-5">
            <h2 className="font-display text-xl sm:text-2xl text-[#ffdad8] tracking-wide">
              {isPillion ? "Pillion Passenger Identity" : "Rider Identity"}
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-mono leading-relaxed mt-0.5">
              {isPillion
                ? "Join the tactical radar on your pilot's motorcycle."
                : "Enter your details for the Road Captain's tactical radar."}
            </p>
          </div>

          {tracking.error ? (
            <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-lg text-xs text-amber-200 flex items-start gap-2.5 mb-4 font-mono">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                  GPS Permission Required
                </p>
                <p className="text-[11px] leading-relaxed text-[#e2cfb8] break-words">
                  {tracking.error}. Please grant location permission in your mobile browser settings and try again.
                </p>
              </div>
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              joinMutation.mutate();
            }}
            className="space-y-3.5 sm:space-y-4"
          >
            {/* Returning to this ride? Quick-reconnect helper */}
            {registeredBikes.length > 0 && (
              <div className="p-3 bg-[#171111] border border-[#442b2a] rounded-xl space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-[#ffdad8] font-bold flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5 text-[#ff535b]" /> Returning to this formation?
                  </span>
                  <span className="text-[9px] text-[#ff535b] bg-[#361313] border border-[#552323] px-1.5 py-0.5 rounded font-bold">
                    Quick Reconnect
                  </span>
                </div>
                <select
                  value={matchingRegisteredProfile?.participantId || ""}
                  onChange={(e) => {
                    const pId = e.target.value;
                    if (pId) {
                      const profile = registeredBikes.find((b) => b.participantId === pId);
                      if (profile) {
                        setRiderName(profile.riderName);
                        setBikeModel(profile.bikeModel);
                        if (profile.bikeNumber) setBikeNumber(profile.bikeNumber);
                        setIsPillion(Boolean(profile.isPillion || profile.role === "pillion"));
                        if (profile.participantId) setParticipantId(profile.participantId);
                      }
                    }
                  }}
                  aria-label="Select your registered profile to resume session"
                  className="w-full h-10 bg-[#0e0a0a] border border-[#552e2e] focus:border-[#ff535b] text-xs text-white font-mono rounded-lg px-2.5 outline-none cursor-pointer"
                >
                  <option value="">-- Choose your callsign to auto-fill & reconnect --</option>
                  {registeredBikes.map((b, idx) => (
                    <option key={b.participantId || idx} value={b.participantId || ""}>
                      {b.role === "lead" ? "👑" : b.role === "marshal" ? "🧭" : b.role === "sweeper" ? "🛡️" : b.isPillion ? "👥" : "🏍️"} {b.riderName} — {b.bikeModel} {b.bikeNumber ? `(${b.bikeNumber})` : ""} {b.role ? `[${b.role.toUpperCase()}]` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Cleared browser or phone rebooted? Select your name to restore your cockpit and role.
                </p>
              </div>
            )}

            {/* Participant Role Selector: Solo Rider vs Pillion Passenger */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#151010] border border-[#3e2424] rounded-xl font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsPillion(false);
                  setPillionRiderName("");
                }}
                className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                  !isPillion
                    ? "bg-[#d91b1b] text-white shadow-[0_0_15px_rgba(217,27,27,0.4)] border border-red-500/60"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Bike className="h-4 w-4" />
                <span>Solo Rider / Pilot</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPillion(true)}
                className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                  isPillion
                    ? "bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)] border border-orange-500/60"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Pillion Passenger</span>
              </button>
            </div>

            {/* Pillion Guidance Banner */}
            {isPillion && (
              <div className="p-3 bg-orange-950/30 border border-orange-500/40 rounded-xl font-mono text-xs text-orange-200/90 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-orange-300 text-[11px]">
                  <Users className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  <span>JOINING AS PILLION (PASSENGER)</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-orange-200/80 leading-relaxed">
                  You will share the motorcycle registration with your pilot rider. Both of you will appear on the tactical radar.
                </p>
              </div>
            )}

            {/* Quick-Pair with Registered Pilot Bike (Pillion Only) */}
            {isPillion && pilotBikesForPairing.length > 0 && (
              <div className="p-3 bg-[#1c130f] border border-orange-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-orange-300 font-bold flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-orange-400" /> Select Pilot Rider&apos;s Bike
                  </span>
                  <span className="text-[9px] font-mono text-orange-400/90 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-500/40">
                    Quick-Pair
                  </span>
                </div>
                <select
                  value={selectedPilotBikeKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedPilotBikeKey(val);
                    if (val) {
                      const selected = pilotBikesForPairing.find(
                        (b) => (b.bikeNumber || `${b.riderName}-${b.bikeModel}`) === val
                      );
                      if (selected) {
                        setBikeModel(selected.bikeModel);
                        if (selected.bikeNumber) setBikeNumber(selected.bikeNumber);
                        setPillionRiderName(selected.riderName);
                      }
                    }
                  }}
                  aria-label="Select Pilot Rider's Bike"
                  className="w-full h-11 bg-[#120c0a] border border-orange-500/40 focus:border-orange-400 text-xs sm:text-sm text-white font-mono rounded-lg px-2.5 outline-none cursor-pointer"
                >
                  <option value="">-- Choose registered pilot bike or enter manually below --</option>
                  {pilotBikesForPairing.map((b, idx) => (
                    <option key={idx} value={b.bikeNumber || `${b.riderName}-${b.bikeModel}`}>
                      🏍️ {b.riderName} — {b.bikeModel} {b.bikeNumber ? `(${b.bikeNumber})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] font-mono text-orange-200/70">
                  Auto-fills bike model and plate so your telemetry pairs with your pilot on the radar.
                </p>
              </div>
            )}

            {/* Optional Profile / Helmet Photo Upload */}
            <div className="p-3 bg-[#181313] border border-[#3e2424] rounded-xl flex flex-col items-center justify-center">
              <div className="relative group">
                {profileImagePreview ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#ff535b] shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profileImagePreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileImageFile(null);
                        setProfileImagePreview(null);
                      }}
                      className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-mono text-red-300 transition cursor-pointer"
                    >
                      <X className="h-4 w-4 mb-0.5" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="profileImageInput"
                    className="w-20 h-20 rounded-full border-2 border-dashed border-[#552e2e] hover:border-[#ff535b] bg-[#100c0c] flex flex-col items-center justify-center cursor-pointer transition text-muted-foreground hover:text-white group"
                  >
                    <Camera className="h-6 w-6 text-[#ff535b] group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-mono uppercase tracking-wider mt-1 text-[#aaa]">Add Photo</span>
                  </label>
                )}
              </div>

              <input
                id="profileImageInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Profile photo must be under 5MB");
                      return;
                    }
                    setProfileImageFile(file);
                    setProfileImagePreview(URL.createObjectURL(file));
                  }
                }}
              />

              <div className="mt-2 text-center">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#ffdad8] font-bold block">
                  Profile / Helmet Photo
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {profileImageFile ? (
                    <span className="text-emerald-400 font-bold">✓ Photo selected (appears on radar map)</span>
                  ) : (
                    "Optional · Displays on tactical map & roster"
                  )}
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                <label htmlFor="riderName" className="text-[11px] font-mono uppercase tracking-wider text-[#ffdad8] flex items-center gap-1.5">
                  <User className="h-3 w-3 text-[#ff535b]" />
                  {isPillion ? "Your Name (Pillion Passenger)" : "Full Name / Club Nickname"}
                </label>
                <span className="text-[9px] font-mono uppercase text-[#ff535b] bg-[#361313] border border-[#552323] px-1.5 py-0.5 rounded leading-none">
                  Required
                </span>
              </div>
              <Input
                id="riderName"
                required
                autoComplete="name"
                autoCapitalize="words"
                placeholder={isPillion ? "e.g. Ananya Sharma" : "e.g. Vikram Singh / Maverick"}
                value={riderName}
                onChange={(e) => setRiderName(e.target.value)}
                className="h-11 sm:h-12 bg-[#171414] border-[#442b2a] focus:border-[#ff535b] text-sm text-white font-mono"
              />
              {nameWarning && (
                <div className="mt-2 p-2.5 bg-amber-950/50 border border-amber-500/60 rounded-lg text-xs text-amber-200 flex items-start gap-2 font-mono">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-snug">{nameWarning}</span>
                </div>
              )}
            </div>

            {/* Pilot Rider's Name (Pillion Only) */}
            {isPillion && (
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                  <label htmlFor="pillionRiderName" className="text-[11px] font-mono uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                    <User className="h-3 w-3 text-orange-400" /> Pilot Rider&apos;s Name
                  </label>
                  <span className="text-[8px] sm:text-[9px] font-mono uppercase text-muted-foreground bg-white/5 border border-white/10 px-1 py-0.5 rounded leading-none">
                    Opt
                  </span>
                </div>
                <Input
                  id="pillionRiderName"
                  autoCapitalize="words"
                  placeholder="e.g. Vikram Singh"
                  value={pillionRiderName}
                  onChange={(e) => setPillionRiderName(e.target.value)}
                  className="h-11 sm:h-12 bg-[#171414] border-orange-500/30 focus:border-orange-400 text-sm text-white font-mono"
                />
              </div>
            )}

            {/* Bike Model */}
            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                <label htmlFor="bikeModel" className="text-[11px] font-mono uppercase tracking-wider text-[#ffdad8] flex items-center gap-1.5">
                  <Bike className="h-3 w-3 text-[#ff535b]" /> Bike Model
                </label>
                <span className="text-[9px] font-mono uppercase text-[#ff535b] bg-[#361313] border border-[#552323] px-1.5 py-0.5 rounded leading-none">
                  Required
                </span>
              </div>
              <Input
                id="bikeModel"
                required
                autoCapitalize="words"
                placeholder={isPillion ? "e.g. Royal Enfield Hunter 350" : "e.g. Royal Enfield Hunter 350"}
                value={bikeModel}
                onChange={(e) => setBikeModel(e.target.value)}
                className="h-11 sm:h-12 bg-[#171414] border-[#442b2a] focus:border-[#ff535b] text-sm text-white font-mono"
              />
            </div>

            {/* Plate Number & Mobile Number */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                  <label htmlFor="bikeNumber" className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#ffdad8] flex items-center gap-1 truncate">
                    <Hash className="h-3 w-3 text-[#ff535b] shrink-0" />
                    <span className="truncate">{isPillion ? "Pilot's Plate" : "Plate No."}</span>
                  </label>
                  <span className="shrink-0 text-[8px] sm:text-[9px] font-mono uppercase text-muted-foreground bg-white/5 border border-white/10 px-1 py-0.5 rounded leading-none">
                    Opt
                  </span>
                </div>
                <Input
                  id="bikeNumber"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="UK 07 XX 0000"
                  value={bikeNumber}
                  onChange={(e) => setBikeNumber(e.target.value.toUpperCase())}
                  className="h-11 sm:h-12 bg-[#171414] border-[#442b2a] focus:border-[#ff535b] text-xs sm:text-sm text-white font-mono uppercase"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                  <label htmlFor="phone" className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[#ffdad8] flex items-center gap-1 truncate">
                    <Phone className="h-3 w-3 text-[#ff535b] shrink-0" />
                    <span className="truncate">Mobile No.</span>
                  </label>
                  <span className="shrink-0 text-[8px] sm:text-[9px] font-mono uppercase text-muted-foreground bg-white/5 border border-white/10 px-1 py-0.5 rounded leading-none">
                    Opt
                  </span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                  className="h-11 sm:h-12 bg-[#171414] border-[#442b2a] focus:border-[#ff535b] text-xs sm:text-sm text-white font-mono"
                />
                {phoneWarning && (
                  <p className="mt-1 text-[10px] text-amber-400 font-mono">{phoneWarning}</p>
                )}
              </div>
            </div>

            {/* Duplication & Pillion Feedback Banners */}
            {bikePlateError && (
              <div className="p-3 bg-red-950/60 border border-red-500/70 rounded-lg text-xs text-red-200 flex items-start gap-2.5 font-mono animate-in fade-in">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-red-300 uppercase tracking-wider text-[11px] block">
                    Bike Plate Conflict
                  </span>
                  <p className="text-[11px] leading-relaxed text-[#fca5a5] break-words">
                    {bikePlateError}
                  </p>
                </div>
              </div>
            )}

            {bikePlateNotice && !bikePlateError && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 flex items-center gap-2 font-mono animate-in fade-in">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-snug">{bikePlateNotice}</span>
              </div>
            )}

            {/* Detected Existing Profile Banner */}
            {matchingRegisteredProfile && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5 font-mono animate-in fade-in">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[11px]">
                    <span>PROFILE DETECTED: {matchingRegisteredProfile.riderName.toUpperCase()}</span>
                    <span className="text-[9px] bg-emerald-900/70 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-500/50 uppercase">
                      {matchingRegisteredProfile.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                    Existing formation registration confirmed for <strong>{matchingRegisteredProfile.bikeModel}</strong>. Submitting will reconnect your cockpit and resume live GPS telemetry.
                  </p>
                </div>
              </div>
            )}

            {/* Tactical Directions & Briefing Notice */}
            <div className="p-3 bg-[#181111] border border-[#442020] rounded-lg text-xs text-[#cfbeb6] space-y-1 font-mono">
              <div className="flex items-center gap-1.5 font-bold text-[#ffdad8] text-[11px]">
                <Sparkles className="h-3.5 w-3.5 text-[#00f0ff] shrink-0" />
                <span>1-TAP TACTICAL GUIDANCE & WAKE-LOCK</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#aa958b] leading-relaxed">
                Road Captain and Direction Marshals broadcast live tactical alerts to your screen. Your screen will stay awake while mounted on handlebars.
              </p>
            </div>

            {/* Lock-Screen Alerts Permission Banner */}
            {notifPermission !== "granted" ? (
              <div className="p-3 bg-[#1e150f] border border-amber-500/50 rounded-lg flex items-center justify-between gap-2.5 font-mono text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <BellRing className="h-4 w-4 text-amber-400 shrink-0 animate-bounce" />
                  <div className="min-w-0">
                    <span className="font-bold text-amber-300 text-[11px] block truncate">
                      Enable Lock-Screen Route Alerts
                    </span>
                    <span className="text-[10px] text-[#b8a599] leading-tight block">
                      Receive live push alerts & chimes when phone is locked
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleEnableNotifications}
                  className="h-8 px-2.5 text-[10px] font-mono uppercase bg-amber-500 hover:bg-amber-400 text-black font-bold shrink-0 cursor-pointer"
                >
                  <Bell className="h-3 w-3 mr-1" /> Allow
                </Button>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/40 rounded-lg flex items-center justify-between font-mono text-xs text-emerald-400">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold">Lock-Screen Route Alerts Enabled</span>
                </div>
                <button
                  type="button"
                  onClick={() => playTacticalAlertChime("direction")}
                  className="text-[10px] text-emerald-300 hover:text-white underline cursor-pointer flex items-center gap-1"
                >
                  <Volume2 className="h-3 w-3" /> Test Chime
                </button>
              </div>
            )}

            {/* Tactical Submit Button */}
            <Button
              type="submit"
              disabled={
                joinMutation.isPending ||
                !riderName.trim() ||
                !bikeModel.trim() ||
                Boolean(bikePlateError) ||
                Boolean(nameWarning)
              }
              className={`w-full min-h-[50px] sm:min-h-[54px] h-auto py-3 px-4 font-display text-base sm:text-xl uppercase tracking-wider text-white border rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer ${
                matchingRegisteredProfile
                  ? "bg-emerald-700 hover:bg-emerald-600 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                  : isPillion
                  ? "bg-orange-600 hover:bg-orange-500 border-orange-500/60 shadow-[0_0_25px_rgba(234,88,12,0.35)]"
                  : "bg-[#d91b1b] hover:bg-[#b51414] border-red-500/50 shadow-[0_0_25px_rgba(217,27,27,0.35)]"
              }`}
            >
              {joinMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="font-mono text-xs sm:text-sm font-bold tracking-wider">
                    {matchingRegisteredProfile ? "RECONNECTING TO COCKPIT..." : "CONNECTING TO RADAR..."}
                  </span>
                </>
              ) : matchingRegisteredProfile ? (
                <>
                  <Radio className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 animate-pulse text-white" />
                  <span className="truncate">
                    RECONNECT & RESUME COCKPIT ({matchingRegisteredProfile.role.toUpperCase()})
                  </span>
                </>
              ) : isPillion ? (
                <>
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 animate-pulse text-white" />
                  <span className="truncate">JOIN FORMATION AS PILLION</span>
                </>
              ) : (
                <>
                  <Radio className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 animate-pulse text-white" />
                  <span className="truncate">JOIN SQUAD & TRANSMIT GPS</span>
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>

      {/* iOS Lock-Screen Push Guide Modal */}
      {showIosGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="w-full max-w-sm bg-[#140e0e] border-2 border-[#552e2e] rounded-xl p-5 shadow-2xl space-y-4 font-mono text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#352020] pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#ff535b] uppercase font-bold tracking-widest block">
                  Apple iOS Requirement
                </span>
                <h3 className="font-display text-xl text-white">Enable Lock-Screen Alerts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-muted-foreground hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#cfbeb6] leading-relaxed">
              Apple requires web apps to be on your Home Screen to display lock-screen push alerts:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-[#1e1313] border border-[#3e2424] rounded-lg flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-[#ff535b]/20 border border-[#ff535b]/40 text-[#ff535b] flex items-center justify-center font-bold shrink-0 text-[11px]">
                  1
                </span>
                <p className="text-[#e2cfb8]">
                  Tap the <strong className="text-white">Share</strong> button (⎙ at bottom of Safari).
                </p>
              </div>
              <div className="p-2.5 bg-[#1e1313] border border-[#3e2424] rounded-lg flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-[#ff535b]/20 border border-[#ff535b]/40 text-[#ff535b] flex items-center justify-center font-bold shrink-0 text-[11px]">
                  2
                </span>
                <p className="text-[#e2cfb8]">
                  Scroll down and tap <strong className="text-white">Add to Home Screen (+)</strong>.
                </p>
              </div>
              <div className="p-2.5 bg-[#1e1313] border border-[#3e2424] rounded-lg flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-[#ff535b]/20 border border-[#ff535b]/40 text-[#ff535b] flex items-center justify-center font-bold shrink-0 text-[11px]">
                  3
                </span>
                <p className="text-[#e2cfb8]">
                  Open <strong>Rebels Radar</strong> from Home Screen to receive lock-screen alerts!
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-[10px] text-emerald-300 space-y-0.5">
              <p className="font-bold">✓ Live Audio Chimes Active</p>
              <p className="text-emerald-300/80">
                While mounted on handlebars in Safari, loud tactical sound alerts & vibration will still fire automatically!
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full bg-[#d91b1b] hover:bg-[#b51414] text-white font-mono text-xs uppercase font-bold py-2.5"
            >
              Got It
            </Button>
          </div>
        </div>
      )}

      {/* Ride QR Code Share Modal */}
      <RideQrDialog
        open={showRiderQr}
        onOpenChange={setShowRiderQr}
        rideTitle={ride.title}
        rideCode={ride.code}
        startLocation={ride.startLocation}
        destination={ride.destination}
      />
    </main>
  );
}
