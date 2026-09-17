// Browser Web Notifications, Web Audio Synthesizer, and Vibration Engine

export type NotificationPermissionStatus = "granted" | "denied" | "default" | "unsupported";

export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      playTacticalAlertChime("direction");
      dispatchBrowserNotification({
        title: "🏍️ Rebels Live Radar Alerts Enabled",
        body: "You will now receive tactical route directions, marshal guide alerts, and stop orders even when your screen is locked.",
        priority: "normal"
      });
    }
    return permission;
  } catch (err) {
    console.warn("Failed to request notification permission:", err);
    return Notification.permission || "denied";
  }
}

/**
 * Synthesize distinct motorsport alert tones using the browser's built-in Web Audio API.
 * Zero external audio files required, works offline and in background tabs.
 */
export function playTacticalAlertChime(priority: "normal" | "urgent" | "direction" = "normal") {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (priority === "urgent") {
      // Urgent: Two sharp high-frequency warning beeps (880Hz -> 1320Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(1320, now + 0.12);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second pulse
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(1046, now + 0.2);
      osc2.frequency.setValueAtTime(1320, now + 0.3);
      gain2.gain.setValueAtTime(0.4, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.55);
    } else if (priority === "direction") {
      // Direction: Ascending triad harmonic chime (523Hz -> 659Hz -> 784Hz "ding-dong-ding")
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } else {
      // Normal: Single tactical blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Autoplay policy or unsupported audio context fallback
  }

  // Device tactile vibration
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      if (priority === "urgent") {
        navigator.vibrate([300, 100, 300, 100, 400]);
      } else if (priority === "direction") {
        navigator.vibrate([200, 100, 200]);
      } else {
        navigator.vibrate([150]);
      }
    }
  } catch {
    // Ignore vibrate errors
  }
}

export type BrowserNotificationOptions = {
  title: string;
  body: string;
  tag?: string;
  priority?: "normal" | "urgent" | "direction";
  icon?: string;
};

/**
 * Trigger a native system notification through the browser.
 * Displays as an OS push banner on Android, iOS (PWA), Windows, and macOS.
 */
export function dispatchBrowserNotification(options: BrowserNotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const isUrgent = options.priority === "urgent";
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag: options.tag || `ror-alert-${Date.now()}`,
      requireInteraction: isUrgent, // Keep on screen if urgent until rider dismisses it
      silent: false
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.warn("Failed to dispatch browser notification:", err);
  }
}

