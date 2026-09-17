// Cross-Platform Mobile & Desktop Web Notifications, Web Audio Synthesizer, and Vibration Engine
// Fully compatible with Android (Chrome/Firefox/Samsung), iOS (PWA/Safari 16.4+), and Desktop OSs

export type NotificationPermissionStatus = "granted" | "denied" | "default" | "unsupported";

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
let sharedAudioCtx: AudioContext | null = null;

/**
 * Detect Apple iOS devices (iPhone, iPad, iPod)
 */
export function isIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Detect Android devices
 */
export function isAndroid(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Detect if web app is running in standalone PWA mode (added to Home Screen)
 */
export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as unknown as { standalone?: boolean }).standalone)
  );
}

/**
 * Unlocks the Web Audio API context on mobile touch/click gestures.
 * Mobile operating systems (iOS and Android) silence Web Audio until the user interacts with the page.
 */
export function unlockAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }

    if (sharedAudioCtx.state === "suspended") {
      void sharedAudioCtx.resume();
    }

    return sharedAudioCtx;
  } catch (err) {
    console.warn("Could not unlock AudioContext:", err);
    return null;
  }
}

// Auto-attach touch listener to unlock audio on first screen interaction
if (typeof window !== "undefined") {
  const handleUserInteraction = () => {
    unlockAudioContext();
    window.removeEventListener("touchstart", handleUserInteraction);
    window.removeEventListener("touchend", handleUserInteraction);
    window.removeEventListener("pointerdown", handleUserInteraction);
    window.removeEventListener("click", handleUserInteraction);
  };
  window.addEventListener("touchstart", handleUserInteraction, { passive: true, once: true });
  window.addEventListener("touchend", handleUserInteraction, { passive: true, once: true });
  window.addEventListener("pointerdown", handleUserInteraction, { passive: true, once: true });
  window.addEventListener("click", handleUserInteraction, { passive: true, once: true });
}

/**
 * Register the Service Worker required for Android Chrome and iOS PWA push alerts.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  if (swRegistrationPromise) return swRegistrationPromise;

  swRegistrationPromise = (async () => {
    try {
      const existing = await navigator.serviceWorker.getRegistration("/");
      if (existing) return existing;
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      return reg;
    } catch (err) {
      console.warn("ServiceWorker registration failed:", err);
      return null;
    }
  })();

  return swRegistrationPromise;
}

/**
 * Check current notification permission status with iOS & Android awareness.
 */
export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (typeof window === "undefined") return "unsupported";

  // iOS Safari in regular tab (non-PWA) does not expose Notification API
  if (!("Notification" in window)) {
    return "unsupported";
  }

  try {
    return Notification.permission;
  } catch {
    return "unsupported";
  }
}

/**
 * Request system notification permission with universal mobile support:
 * - Handles both Promise-based and Callback-based Notification.requestPermission()
 * - Registers Service Worker required by Chrome on Android & iOS PWA
 * - Unlocks Web Audio chime synthesizer
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === "undefined") return "unsupported";

  // 1. Immediately unlock Web Audio on this user interaction
  unlockAudioContext();

  // 2. Pre-register Service Worker
  try {
    void registerServiceWorker();
  } catch {}

  // 3. Handle devices where Notification is not available
  if (!("Notification" in window)) {
    // If iOS in regular Safari, sound chimes are still supported
    playTacticalAlertChime("direction");
    return "unsupported";
  }

  try {
    let permission: NotificationPermission = Notification.permission;

    // Cross-browser dual-mode request (supports modern Promise and legacy Callback for older WebKit)
    if (permission === "default") {
      try {
        const promiseResult = Notification.requestPermission();
        if (promiseResult && typeof promiseResult.then === "function") {
          permission = await promiseResult;
        } else {
          permission = await new Promise<NotificationPermission>((resolve) => {
            Notification.requestPermission((p) => resolve(p));
          });
        }
      } catch {
        permission = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission((p) => resolve(p));
        });
      }
    }

    if (permission === "granted") {
      playTacticalAlertChime("direction");
      void dispatchBrowserNotification({
        title: "🏍️ Rebels Live Radar Alerts Active",
        body: "Tactical route directions, marshal instructions, and safety alerts are now active.",
        priority: "normal"
      });
    }

    return permission;
  } catch (err) {
    console.warn("Failed to request notification permission:", err);
    return ("Notification" in window && Notification.permission) || "denied";
  }
}

/**
 * Synthesize distinct motorsport alert tones using the browser's built-in Web Audio API.
 * Zero external audio files required, works offline, on handlebars, and in background tabs.
 */
export function playTacticalAlertChime(priority: "normal" | "urgent" | "direction" = "normal") {
  if (typeof window === "undefined") return;

  try {
    const ctx = unlockAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (priority === "urgent") {
      // Urgent: Two sharp high-frequency warning beeps (880Hz -> 1320Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(1320, now + 0.12);
      gain1.gain.setValueAtTime(0.45, now);
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
      gain2.gain.setValueAtTime(0.45, now + 0.2);
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
        gain.gain.setValueAtTime(0.35, startTime);
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
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Autoplay policy fallback
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
  badge?: string;
};

/**
 * Trigger a native system notification through the browser.
 * Uses ServiceWorkerRegistration.showNotification() for Android Chrome & iOS PWA,
 * with fallback to window.Notification constructor on desktop browsers.
 */
export async function dispatchBrowserNotification(options: BrowserNotificationOptions) {
  if (typeof window === "undefined") return;

  const isUrgent = options.priority === "urgent";
  const iconUrl = options.icon || "/images/rebels-on-roads-3d.png";
  const badgeUrl = options.badge || "/images/rebels-on-roads-3d.png";
  const tag = options.tag || `ror-alert-${Date.now()}`;
  const vibratePattern = isUrgent ? [300, 100, 300, 100, 400] : [200, 100, 200];

  const notificationOptions = {
    body: options.body,
    icon: iconUrl,
    badge: badgeUrl,
    tag,
    vibrate: vibratePattern,
    requireInteraction: isUrgent,
    silent: false,
    data: { url: window.location.href }
  };

  // METHOD 1 (Primary for Mobile): ServiceWorker showNotification
  // MANDATORY for Android Chrome and iOS PWA, where `new Notification()` throws an Illegal Constructor error
  if ("serviceWorker" in navigator) {
    try {
      let reg = await registerServiceWorker();
      if (!reg) {
        reg = await navigator.serviceWorker.ready;
      }
      if (reg && typeof reg.showNotification === "function") {
        await reg.showNotification(options.title, notificationOptions);
        return;
      }
    } catch (swErr) {
      console.warn("ServiceWorker showNotification failed, attempting fallback:", swErr);
    }
  }

  // METHOD 2 (Fallback for Desktop): Standard window.Notification
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const notification = new Notification(options.title, notificationOptions);
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (notifErr) {
      console.warn("Window Notification constructor failed:", notifErr);
    }
  }
}
