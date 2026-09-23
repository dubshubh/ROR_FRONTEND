// Rebels on Roads - Service Worker for Mobile Tactical Alerts, PWA & Background GPS Persistence
// Provides lock-screen notifications and background telemetry keep-alive when browser is minimized/closed

let bgTrackingState = null;
let bgIntervalId = null;

async function sendBackgroundHeartbeat() {
  if (
    !bgTrackingState ||
    !bgTrackingState.apiBaseUrl ||
    !bgTrackingState.code ||
    !bgTrackingState.participantId
  ) {
    return;
  }
  try {
    await fetch(
      `${bgTrackingState.apiBaseUrl}/live-rides/${bgTrackingState.code}/location`,
      `${bgTrackingState.apiBaseUrl}/live-rides/${bgTrackingState.code}/ping`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          participantId: bgTrackingState.participantId,
          latitude: bgTrackingState.latitude || 0,
          longitude: bgTrackingState.longitude || 0,
          speed: bgTrackingState.speed || 0,
          heading: bgTrackingState.heading || 0,
          accuracy: bgTrackingState.accuracy || 0,
        }),
      },
    );
  } catch {
    // Retry on next cycle
  }
}

function startBackgroundLoop() {
  if (bgIntervalId) clearInterval(bgIntervalId);
  bgIntervalId = setInterval(() => {
    void sendBackgroundHeartbeat();
  }, 10000);
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for client messages (notifications + background GPS state sync)
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SHOW_NOTIFICATION") {
    const { title, options } = event.data;
    event.waitUntil(self.registration.showNotification(title, options));
  } else if (event.data.type === "SYNC_GPS_STATE") {
    bgTrackingState = event.data.payload;
    startBackgroundLoop();
    event.waitUntil(sendBackgroundHeartbeat());
  } else if (event.data.type === "STOP_GPS_SYNC") {
    bgTrackingState = null;
    if (bgIntervalId) {
      clearInterval(bgIntervalId);
      bgIntervalId = null;
    }
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "ror-gps-sync") {
    event.waitUntil(sendBackgroundHeartbeat());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "ror-gps-periodic") {
    event.waitUntil(sendBackgroundHeartbeat());
  }
});

// User taps on notification in Android / iOS status bar or lock screen
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (
            client.url &&
            (client.url.includes("/live-ride") ||
              client.url.includes("/admin/live-rides")) &&
            "focus" in client
          ) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
