"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dispatchBrowserNotification, playTacticalAlertChime } from "@/lib/notifications";
import { pingLocation } from "@/services/live-ride.service";
import type { BroadcastMessage, ParticipantRole } from "@/types/live-ride";

type TrackingState = {
  isTracking: boolean;
  latitude: number | null;
  longitude: number | null;
  speed: number; // km/h
  heading: number; // degrees
  accuracy: number; // meters
  lastPingTime: Date | null;
  wakeLockActive: boolean;
  ejected: boolean;
  completed: boolean;
  role: ParticipantRole;
  activeParticipantsCount: number | null;
  showRiderCountToSquad: boolean;
  messages: BroadcastMessage[];
  quickMessages: string[];
  latestBroadcast: BroadcastMessage | null;
  error: string | null;
};

function playTacticalChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Autoplay fallback
  }

  try {
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // Ignore vibrate errors
  }
}

export function useLiveTracking() {
  const [state, setState] = useState<TrackingState>({
    isTracking: false,
    latitude: null,
    longitude: null,
    speed: 0,
    heading: 0,
    accuracy: 0,
    lastPingTime: null,
    wakeLockActive: false,
    ejected: false,
    completed: false,
    role: "rider",
    activeParticipantsCount: null,
    showRiderCountToSquad: false,
    messages: [],
    quickMessages: [],
    latestBroadcast: null,
    error: null
  });

  const watchIdRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lastSentRef = useRef<number>(0);
  const codeRef = useRef<string>("");
  const participantIdRef = useRef<string>("");
  const lastNotifiedMsgIdRef = useRef<string>("");
  const latestCoordsRef = useRef<{
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    accuracy: number;
  } | null>(null);

  // Start inaudible silent audio to prevent mobile OS tab freezing
  const startSilentAudio = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // 1-second silent buffer
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(ctx.destination);
      source.start();
      audioSourceRef.current = source;

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Live GPS Active",
          artist: "Rebels on Roads Command Center",
          album: "Squad Location Sharing"
        });
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  const stopSilentAudio = useCallback(() => {
    try {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch {
      // Best-effort cleanup
    }
  }, []);

  // Screen Wake Lock to prevent screen sleep on bike mounts
  const acquireWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        const lock = await navigator.wakeLock.request("screen");
        wakeLockRef.current = lock;
        setState((prev) => ({ ...prev, wakeLockActive: true }));

        lock.addEventListener("release", () => {
          wakeLockRef.current = null;
          setState((prev) => ({ ...prev, wakeLockActive: false }));
        });
      } catch {
        setState((prev) => ({ ...prev, wakeLockActive: false }));
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      void wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    setState((prev) => ({ ...prev, wakeLockActive: false }));
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (heartbeatTimerRef.current !== null) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    releaseWakeLock();
    stopSilentAudio();
    setState((prev) => ({ ...prev, isTracking: false }));
  }, [releaseWakeLock, stopSilentAudio]);

  const sendTelemetry = useCallback(
    async (latitude: number, longitude: number, speed: number, heading: number, accuracy: number) => {
      if (!participantIdRef.current || !codeRef.current) return;
      const now = Date.now();
      if (now - lastSentRef.current < 3000) return;
      lastSentRef.current = now;

      try {
        const res = await pingLocation(codeRef.current, {
          participantId: participantIdRef.current,
          latitude,
          longitude,
          speed,
          heading,
          accuracy
        });

        if (res.rideStatus === "completed") {
          stopTracking();
          setState((prev) => ({ ...prev, completed: true }));
          return;
        } else if (res.participantStatus === "ejected") {
          stopTracking();
          setState((prev) => ({ ...prev, ejected: true }));
          return;
        }

        const msgs = res.messages || [];
        const latest = msgs.length ? msgs[msgs.length - 1] : null;

        if (latest && latest._id && latest._id !== lastNotifiedMsgIdRef.current) {
          lastNotifiedMsgIdRef.current = latest._id;
          playTacticalChime();
          const isDirectToMe = Boolean(
            latest.targetParticipantId && latest.targetParticipantId === participantIdRef.current
          );
          const priority = isDirectToMe ? "urgent" : latest.priority || "direction";
          playTacticalAlertChime(priority);

          const title = isDirectToMe
            ? `🚨 DIRECT ORDER FOR YOU (${latest.senderRole === "lead" ? "Road Captain" : "Marshal"} ${latest.senderName})`
            : latest.senderRole === "lead"
            ? `👑 Road Captain: ${latest.senderName}`
            : latest.senderRole === "marshal"
            ? `🧭 Marshal Guide: ${latest.senderName}`
            : `📢 Squad Broadcast: ${latest.senderName}`;

          dispatchBrowserNotification({
            title,
            body: latest.text,
            priority,
            tag: latest._id
          });
        }

        setState((prev) => ({
          ...prev,
          lastPingTime: new Date(),
          role: res.participantRole || prev.role,
          activeParticipantsCount:
            typeof res.activeParticipantsCount === "number"
              ? res.activeParticipantsCount
              : res.activeParticipantsCount === null
              ? null
              : prev.activeParticipantsCount,
          showRiderCountToSquad:
            typeof res.showRiderCountToSquad === "boolean"
              ? res.showRiderCountToSquad
              : prev.showRiderCountToSquad,
          messages: msgs.length ? msgs : prev.messages,
          quickMessages: res.quickMessages?.length ? res.quickMessages : prev.quickMessages,
          latestBroadcast: latest || prev.latestBroadcast
        }));
      } catch (err) {
        console.warn("Telemetry broadcast failed, will retry:", err);
      }
    },
    [stopTracking]
  );

  const startTracking = useCallback(
    async (code: string, participantId: string) => {
      codeRef.current = code;
      participantIdRef.current = participantId;

      if (!("geolocation" in navigator)) {
        setState((prev) => ({ ...prev, error: "Geolocation is not supported by your browser" }));
        return;
      }

      startSilentAudio();
      await acquireWakeLock();

      setState((prev) => ({
        ...prev,
        isTracking: true,
        ejected: false,
        completed: false,
        error: null
      }));

      const handlePosition = (position: GeolocationPosition) => {
        const { latitude, longitude, speed, heading, accuracy } = position.coords;
        const speedKmH = speed ? Math.round(speed * 3.6) : 0;
        const compassHeading = heading || 0;
        const roundedAccuracy = Math.round(accuracy);

        latestCoordsRef.current = {
          latitude,
          longitude,
          speed: speedKmH,
          heading: compassHeading,
          accuracy: roundedAccuracy
        };

        setState((prev) => ({
          ...prev,
          latitude,
          longitude,
          speed: speedKmH,
          heading: compassHeading,
          accuracy: roundedAccuracy
        }));

        void sendTelemetry(latitude, longitude, speedKmH, compassHeading, roundedAccuracy);
      };

      const handleError = (error: GeolocationPositionError) => {
        let errorMsg = "Unable to acquire location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access denied. Please enable GPS permissions in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "GPS position unavailable. Ensure location services are turned on.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "GPS request timed out. Retrying...";
        }
        setState((prev) => ({ ...prev, error: errorMsg }));
      };

      // Step 1: Immediate coarse/cached lock for instantaneous display
      navigator.geolocation.getCurrentPosition(
        handlePosition,
        () => {
          // Non-fatal, continuous watcher will acquire
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
      );

      // Step 2: Continuous high-accuracy watcher for live movement
      const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      });
      watchIdRef.current = watchId;

      // Step 3: Periodic 4-second stationary heartbeat ping
      if (heartbeatTimerRef.current !== null) {
        clearInterval(heartbeatTimerRef.current);
      }
      heartbeatTimerRef.current = setInterval(() => {
        if (latestCoordsRef.current) {
          const { latitude, longitude, speed, heading, accuracy } = latestCoordsRef.current;
          void sendTelemetry(latitude, longitude, speed, heading, accuracy);
        }
      }, 4000);
    },
    [acquireWakeLock, sendTelemetry, startSilentAudio]
  );

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking
  };
}
