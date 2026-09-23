"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dispatchBrowserNotification, playTacticalAlertChime } from "@/lib/notifications";
import { pingLocation } from "@/services/live-ride.service";
import type { BroadcastMessage, Participant, ParticipantRole } from "@/types/live-ride";

type TrackingState = {
  isTracking: boolean;
  latitude: number | null;
  longitude: number | null;
  speed: number; // km/h
  heading: number; // degrees
  accuracy: number; // meters
  lastPingTime: Date | null;
  clockOffset: number; // serverTime - Date.now()
  wakeLockActive: boolean;
  ejected: boolean;
  completed: boolean;
  role: ParticipantRole;
  activeParticipantsCount: number | null;
  showRiderCountToSquad: boolean;
  participants: Participant[];
  messages: BroadcastMessage[];
  quickMessages: string[];
  latestBroadcast: BroadcastMessage | null;
  error: string | null;
};

function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

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
    participants: [],
    clockOffset: 0,
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
  const lastKnownHeadingRef = useRef<number>(0);
  const prevPositionRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);
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
          try {
            if (codeRef.current) {
              localStorage.removeItem(`ror_live_session_${codeRef.current}`);
            }
          } catch {}
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

        const serverOffset = res.serverTime ? Date.parse(res.serverTime) - Date.now() : 0;

        setState((prev) => ({
          ...prev,
          lastPingTime: new Date(),
          clockOffset: serverOffset !== 0 ? serverOffset : prev.clockOffset,
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
          participants: res.participants && res.participants.length > 0 ? res.participants : prev.participants,
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
        const now = position.timestamp || Date.now();
        let speedKmH = 0;

        // If native GPS provides speed, use it; otherwise compute velocity via Haversine distance
        if (typeof speed === "number" && !isNaN(speed) && speed >= 0) {
          speedKmH = Math.round(speed * 3.6);
        } else if (prevPositionRef.current) {
          const elapsedSec = (now - prevPositionRef.current.timestamp) / 1000;
          if (elapsedSec > 0.5 && elapsedSec < 15) {
            const distKm = calculateHaversineDistanceKm(
              prevPositionRef.current.latitude,
              prevPositionRef.current.longitude,
              latitude,
              longitude
            );
            const calculatedSpeed = (distKm / elapsedSec) * 3600;
            // Filter out erratic GPS jumps (e.g. max realistic motorcycle speed 220 km/h)
            if (calculatedSpeed >= 0 && calculatedSpeed < 220) {
              speedKmH = Math.round(calculatedSpeed);
            }
          }
        }

        // Heading calculation & stabilization (prevent snapping North at stops)
        let compassHeading = lastKnownHeadingRef.current;
        if (typeof heading === "number" && !isNaN(heading) && heading >= 0) {
          compassHeading = Math.round(heading);
          lastKnownHeadingRef.current = compassHeading;
        } else if (prevPositionRef.current && speedKmH >= 4) {
          // If moving at >= 4 km/h, derive heading from bearing between previous and current fix
          const derivedBearing = Math.round(
            calculateBearing(prevPositionRef.current.latitude, prevPositionRef.current.longitude, latitude, longitude)
          );
          compassHeading = derivedBearing;
          lastKnownHeadingRef.current = derivedBearing;
        }

        prevPositionRef.current = { latitude, longitude, timestamp: now };
        const roundedAccuracy = Math.round(accuracy || 0);

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

      // Step 1: Immediate coarse/cached lock for instantaneous display (max 5s age)
      navigator.geolocation.getCurrentPosition(
        handlePosition,
        () => {
          // Non-fatal, continuous watcher will acquire
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 5000 }
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

  // Auto re-acquire wake lock when tab becomes visible (returning from Google Maps, phone calls, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible" && state.isTracking) {
        void acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.isTracking, acquireWakeLock]);

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
