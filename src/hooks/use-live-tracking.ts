"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dispatchBrowserNotification, playTacticalAlertChime } from "@/lib/notifications";
import { api } from "@/services/api";
import { pingLocation } from "@/services/live-ride.service";
import type { BroadcastMessage, Participant, ParticipantRole } from "@/types/live-ride";

type TrackingState = {
  isTracking: boolean;
  latitude: number | null;
  longitude: number | null;
  speed: number; // km/h
  heading: number; // degrees
  accuracy: number; // meters
  locationSource: "gps" | "manual" | "ip" | "pending";
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

// Create a 1-second non-zero sub-audible WAV data URI so mobile OS media sessions never classify it as digital silence
function createKeepAliveWavDataUri(): string {
  const sampleRate = 8000;
  const numSamples = sampleRate;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  // Non-zero imperceptible 1-LSB alternating signal (prevents Chrome/iOS silence detector from killing background tab)
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, i % 2 === 0 ? 2 : -2, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
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
    locationSource: "pending",
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
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastSentRef = useRef<number>(0);
  const hasSentRealGpsRef = useRef<boolean>(false);
  const manualOverrideRef = useRef<boolean>(false);
  const codeRef = useRef<string>("");
  const participantIdRef = useRef<string>("");
  const lastNotifiedMsgIdRef = useRef<string>("");
  const lastKnownHeadingRef = useRef<number>(0);
  const bestAccuracyRef = useRef<number>(999999);
  const prevPositionRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);
  const latestCoordsRef = useRef<{
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    accuracy: number;
  } | null>(null);

  const syncServiceWorkerState = useCallback(() => {
    try {
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
        if (codeRef.current && participantIdRef.current) {
          navigator.serviceWorker.controller.postMessage({
            type: "SYNC_GPS_STATE",
            payload: {
              apiBaseUrl: (api.defaults.baseURL || "/api"),
              code: codeRef.current,
              participantId: participantIdRef.current,
              latitude: latestCoordsRef.current?.latitude || 0,
              longitude: latestCoordsRef.current?.longitude || 0,
              speed: latestCoordsRef.current?.speed || 0,
              heading: latestCoordsRef.current?.heading || 0,
              accuracy: latestCoordsRef.current?.accuracy || 0
            }
          });
        }
      }
    } catch {
      // Ignore SW sync errors
    }
  }, []);

  // Start non-zero sub-audible audio + HTML5 Audio loop to keep mobile browser & GPS alive when locked/minimized
  const startSilentAudio = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = i % 2 === 0 ? 0.0001 : -0.0001;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(ctx.destination);
        source.start();
        audioSourceRef.current = source;
      }

      if (!htmlAudioRef.current && typeof Audio !== "undefined") {
        const audio = new Audio(createKeepAliveWavDataUri());
        audio.loop = true;
        audio.volume = 0.01;
        audio.setAttribute("playsinline", "true");
        htmlAudioRef.current = audio;
        void audio.play().catch(() => {});
      }

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Live GPS Radar Active",
          artist: "Rebels on Roads Command Center",
          album: "Background Squad Telemetry"
        });
        navigator.mediaSession.playbackState = "playing";
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
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        htmlAudioRef.current = null;
      }
    } catch {
      // Best-effort cleanup
    }
  }, []);

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
    try {
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "STOP_GPS_SYNC" });
      }
    } catch {}
    releaseWakeLock();
    stopSilentAudio();
    setState((prev) => ({ ...prev, isTracking: false }));
  }, [releaseWakeLock, stopSilentAudio]);

  const sendTelemetry = useCallback(
    async (
      latitude: number,
      longitude: number,
      speed: number,
      heading: number,
      accuracy: number,
      force = false
    ) => {
      if (!participantIdRef.current || !codeRef.current) return;
      const isRealCoord = latitude !== 0 && longitude !== 0;
      const now = Date.now();

      // Never throttle if force=true or if this is the very first real GPS fix
      if (!force && !(isRealCoord && !hasSentRealGpsRef.current) && now - lastSentRef.current < 2500) {
        return;
      }
      lastSentRef.current = now;
      if (isRealCoord) {
        hasSentRealGpsRef.current = true;
      }

      syncServiceWorkerState();

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
        const isSentByMe = Boolean(
          latest &&
            latest.senderParticipantId &&
            participantIdRef.current &&
            String(latest.senderParticipantId) === String(participantIdRef.current)
        );

        if (latest && latest._id && latest._id !== lastNotifiedMsgIdRef.current) {
          lastNotifiedMsgIdRef.current = latest._id;
          if (!isSentByMe) {
            playTacticalChime();
            const isDirectToMe = Boolean(
              latest.targetParticipantId && String(latest.targetParticipantId) === String(participantIdRef.current)
            );
            const priority = isDirectToMe ? "urgent" : latest.priority || "normal";
            playTacticalAlertChime(priority);

            const title = isDirectToMe
              ? `🚨 DIRECT MESSAGE FOR YOU (${latest.senderName})`
              : latest.senderRole === "lead"
              ? `👑 Road Captain: ${latest.senderName}`
              : latest.senderRole === "marshal"
              ? `🧭 Marshal Guide: ${latest.senderName}`
              : latest.senderRole === "admin"
              ? `📡 Admin Command: ${latest.senderName}`
              : `🏍️ Squad Rider: ${latest.senderName}`;

            dispatchBrowserNotification({
              title,
              body: latest.text,
              priority,
              tag: latest._id
            });
          }
        }

        const serverOffset = res.serverTime ? Date.parse(res.serverTime) - Date.now() : 0;

        setState((prev) => ({
          ...prev,
          isTracking: true,
          ejected: false,
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
          latestBroadcast: !isSentByMe && latest ? latest : prev.latestBroadcast
        }));
      } catch (err) {
        console.warn("Telemetry broadcast failed, will retry:", err);
      }
    },
    [stopTracking, syncServiceWorkerState]
  );

  // Fallback IP Geolocation when browser location permission is blocked (🚫📍) or unavailable on desktop PC
  const fetchIpFallbackLocation = useCallback(async () => {
    if (manualOverrideRef.current || hasSentRealGpsRef.current) return;
    try {
      const res = await fetch("https://ipwho.is/", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.latitude === "number" && typeof data.longitude === "number" && data.latitude !== 0) {
          if (manualOverrideRef.current || hasSentRealGpsRef.current) return;
          latestCoordsRef.current = {
            latitude: data.latitude,
            longitude: data.longitude,
            speed: 0,
            heading: 0,
            accuracy: 250
          };
          setState((prev) => ({
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: 250,
            locationSource: "ip"
          }));
          void sendTelemetry(data.latitude, data.longitude, 0, 0, 250, true);
          return;
        }
      }
    } catch {
      // Try backup IP geolocation provider
    }

    try {
      const res2 = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && typeof data2.latitude === "number" && typeof data2.longitude === "number" && data2.latitude !== 0) {
          if (manualOverrideRef.current || hasSentRealGpsRef.current) return;
          latestCoordsRef.current = {
            latitude: data2.latitude,
            longitude: data2.longitude,
            speed: 0,
            heading: 0,
            accuracy: 250
          };
          setState((prev) => ({
            ...prev,
            latitude: data2.latitude,
            longitude: data2.longitude,
            accuracy: 250,
            locationSource: "ip"
          }));
          void sendTelemetry(data2.latitude, data2.longitude, 0, 0, 250, true);
        }
      }
    } catch {
      // Ignore IP fallback error
    }
  }, [sendTelemetry]);

  // Allow user (Admin or Rider) to click any exact street/spot on the map to pin their exact 1m location
  const setManualLocation = useCallback(
    (latitude: number, longitude: number) => {
      manualOverrideRef.current = true;
      bestAccuracyRef.current = 1;
      latestCoordsRef.current = {
        latitude,
        longitude,
        speed: 0,
        heading: lastKnownHeadingRef.current,
        accuracy: 1
      };
      setState((prev) => ({
        ...prev,
        isTracking: true,
        latitude,
        longitude,
        accuracy: 1,
        locationSource: "manual",
        error: null
      }));
      void sendTelemetry(latitude, longitude, 0, lastKnownHeadingRef.current, 1, true);
    },
    [sendTelemetry]
  );

  // Force a fresh high-accuracy hardware GPS lock immediately
  const refreshExactGps = useCallback(() => {
    manualOverrideRef.current = false;
    bestAccuracyRef.current = 999999;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      void fetchIpFallbackLocation();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, speed, heading, accuracy } = position.coords;
        const speedKmH = typeof speed === "number" && !isNaN(speed) && speed >= 0 ? Math.round(speed * 3.6) : 0;
        const compassHeading =
          typeof heading === "number" && !isNaN(heading) && heading >= 0
            ? Math.round(heading)
            : lastKnownHeadingRef.current;
        const roundedAccuracy = Math.max(1, Math.round(accuracy || 5));
        bestAccuracyRef.current = roundedAccuracy;

        latestCoordsRef.current = {
          latitude,
          longitude,
          speed: speedKmH,
          heading: compassHeading,
          accuracy: roundedAccuracy
        };
        setState((prev) => ({
          ...prev,
          isTracking: true,
          latitude,
          longitude,
          speed: speedKmH,
          heading: compassHeading,
          accuracy: roundedAccuracy,
          locationSource: "gps",
          error: null
        }));
        void sendTelemetry(latitude, longitude, speedKmH, compassHeading, roundedAccuracy, true);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState((prev) => ({
            ...prev,
            error: "Browser GPS permission is blocked (🚫 in URL bar). Allow Location in site settings or use '📌 Pin My Spot' on the map."
          }));
        }
        void fetchIpFallbackLocation();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [fetchIpFallbackLocation, sendTelemetry]);

  const startTracking = useCallback(
    async (code: string, participantId: string) => {
      codeRef.current = code;
      participantIdRef.current = participantId;
      hasSentRealGpsRef.current = false;

      if (!latestCoordsRef.current) {
        latestCoordsRef.current = {
          latitude: 0,
          longitude: 0,
          speed: 0,
          heading: 0,
          accuracy: 0
        };
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

      // Immediate keep-alive heartbeat so participant is registered as LIVE right away
      void sendTelemetry(
        latestCoordsRef.current.latitude,
        latestCoordsRef.current.longitude,
        latestCoordsRef.current.speed,
        latestCoordsRef.current.heading,
        latestCoordsRef.current.accuracy,
        true
      );

      // Periodic 4-second stationary/keep-alive heartbeat ping
      if (heartbeatTimerRef.current !== null) {
        clearInterval(heartbeatTimerRef.current);
      }
      heartbeatTimerRef.current = setInterval(() => {
        const coords = latestCoordsRef.current || {
          latitude: 0,
          longitude: 0,
          speed: 0,
          heading: 0,
          accuracy: 0
        };
        void sendTelemetry(coords.latitude, coords.longitude, coords.speed, coords.heading, coords.accuracy);
      }, 4000);

      if (!("geolocation" in navigator)) {
        setState((prev) => ({ ...prev, error: "Geolocation is not supported by your browser" }));
        void fetchIpFallbackLocation();
        return;
      }

      const handlePosition = (position: GeolocationPosition) => {
        if (manualOverrideRef.current) return;

        const { latitude, longitude, speed, heading, accuracy } = position.coords;
        const roundedAccuracy = Math.max(1, Math.round(accuracy || 10));

        // Prevent sudden coarse ISP/cell tower jumps (>800m) from overwriting an existing accurate GPS fix (<=100m)
        if (bestAccuracyRef.current <= 100 && roundedAccuracy > 800) {
          return;
        }
        if (roundedAccuracy < bestAccuracyRef.current) {
          bestAccuracyRef.current = roundedAccuracy;
        }

        const now = position.timestamp || Date.now();
        let speedKmH = 0;

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
            if (calculatedSpeed >= 0 && calculatedSpeed < 220) {
              speedKmH = Math.round(calculatedSpeed);
            }
          }
        }

        let compassHeading = lastKnownHeadingRef.current;
        if (typeof heading === "number" && !isNaN(heading) && heading >= 0) {
          compassHeading = Math.round(heading);
          lastKnownHeadingRef.current = compassHeading;
        } else if (prevPositionRef.current && speedKmH >= 4) {
          const derivedBearing = Math.round(
            calculateBearing(prevPositionRef.current.latitude, prevPositionRef.current.longitude, latitude, longitude)
          );
          compassHeading = derivedBearing;
          lastKnownHeadingRef.current = derivedBearing;
        }

        prevPositionRef.current = { latitude, longitude, timestamp: now };

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
          accuracy: roundedAccuracy,
          locationSource: "gps",
          error: null
        }));

        void sendTelemetry(latitude, longitude, speedKmH, compassHeading, roundedAccuracy);
      };

      const handleError = (error: GeolocationPositionError) => {
        let errorMsg = "Unable to acquire exact GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg =
            "Location permission is blocked in your browser (🚫 in address bar). Allow Location or click '📌 Pin My Spot' on the map.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Hardware GPS unavailable. Using network location or click '📌 Pin My Spot' on the map.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "High-accuracy GPS timed out. Retrying...";
        }
        setState((prev) => ({ ...prev, error: errorMsg }));
        void fetchIpFallbackLocation();
      };

      // Step 1: High-accuracy hardware GPS request (maximumAge: 0 guarantees fresh satellite/Wi-Fi lock)
      navigator.geolocation.getCurrentPosition(
        handlePosition,
        () => {
          // If strict high-accuracy times out, try coarse network position before IP fallback
          navigator.geolocation.getCurrentPosition(
            handlePosition,
            () => {
              void fetchIpFallbackLocation();
            },
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 0 }
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Step 2: Continuous high-accuracy watcher for live movement
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
      watchIdRef.current = watchId;
    },
    [acquireWakeLock, fetchIpFallbackLocation, sendTelemetry, startSilentAudio]
  );

  // Flush keepalive beacon & sync Service Worker when tab is hidden, minimized, or closed
  useEffect(() => {
    const flushBackgroundBeacon = () => {
      if (!state.isTracking || !codeRef.current || !participantIdRef.current) return;
      syncServiceWorkerState();

      const coords = latestCoordsRef.current || {
        latitude: 0,
        longitude: 0,
        speed: 0,
        heading: 0,
        accuracy: 0
      };

      try {
        void fetch(`${(api.defaults.baseURL || "/api")}/live-rides/${codeRef.current}/ping`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            participantId: participantIdRef.current,
            latitude: coords.latitude,
            longitude: coords.longitude,
            speed: coords.speed,
            heading: coords.heading,
            accuracy: coords.accuracy
          })
        });
      } catch {}
    };

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined") {
        if (document.visibilityState === "visible" && state.isTracking) {
          void acquireWakeLock();
          if (htmlAudioRef.current) {
            void htmlAudioRef.current.play().catch(() => {});
          }
        } else if (document.visibilityState === "hidden" && state.isTracking) {
          flushBackgroundBeacon();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", flushBackgroundBeacon);
    window.addEventListener("beforeunload", flushBackgroundBeacon);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", flushBackgroundBeacon);
      window.removeEventListener("beforeunload", flushBackgroundBeacon);
    };
  }, [state.isTracking, acquireWakeLock, syncServiceWorkerState]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  const appendLocalMessage = useCallback((msg: BroadcastMessage) => {
    if (msg._id) {
      lastNotifiedMsgIdRef.current = msg._id;
    }
    setState((prev) => {
      const exists = prev.messages.some((m) => m._id && m._id === msg._id);
      return {
        ...prev,
        messages: exists ? prev.messages : [...prev.messages, msg]
      };
    });
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    setManualLocation,
    refreshExactGps,
    appendLocalMessage
  };
}
