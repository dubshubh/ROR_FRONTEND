// Rebels on Roads - Service Worker for Mobile Tactical Alerts, PWA & Background GPS Persistence
// Persists telemetry state in IndexedDB so background heartbeats continue when browser is closed until explicit Exit

const DB_NAME = "ror_bg_gps_db";
const STORE_NAME = "tracking_state";
const STATE_KEY = "active_ride";

let bgTrackingState = null;
let bgIntervalId = null;

function openGpsDb() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

async function saveGpsStateToIdb(state) {
  try {
    const db = await openGpsDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(state, STATE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

async function loadGpsStateFromIdb() {
  try {
    const db = await openGpsDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(STATE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function clearGpsStateFromIdb() {
  try {
    const db = await openGpsDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(STATE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

async function sendBackgroundHeartbeat() {
  if (!bgTrackingState) {
    bgTrackingState = await loadGpsStateFromIdb();
  }
  if (
    !bgTrackingState ||
    !bgTrackingState.apiBaseUrl ||
    !bgTrackingState.code ||
    !bgTrackingState.participantId
  ) {
    return;
  }
  try {
    const res = await fetch(
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
          accuracy: bgTrackingState.accuracy || 0
        })
      }
    );
    if (res.ok) {
      const data = await res.json();
      // Stop background heartbeats only if ride ended or rider was ejected/left
      if (
        data.rideStatus === "completed" ||
        data.participantStatus === "ejected" ||
        data.participantStatus === "left"
      ) {
        bgTrackingState = null;
        if (bgIntervalId) {
          clearInterval(bgIntervalId);
          bgIntervalId = null;
        }
        await clearGpsStateFromIdb();
      }
    }
  } catch {
    // Retry on next cycle
  }
}

function startBackgroundLoop() {
  if (bgIntervalId) clearInterval(bgIntervalId);
  bgIntervalId = setInterval(() => {
    void sendBackgroundHeartbeat();
  }, 8000);
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const saved = await loadGpsStateFromIdb();
      if (saved) {
        bgTrackingState = saved;
        startBackgroundLoop();
        await sendBackgroundHeartbeat();
      }
    })()
  );
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
    event.waitUntil(
      (async () => {
        await saveGpsStateToIdb(bgTrackingState);
        await sendBackgroundHeartbeat();
      })()
    );
  } else if (event.data.type === "STOP_GPS_SYNC") {
    bgTrackingState = null;
    if (bgIntervalId) {
      clearInterval(bgIntervalId);
      bgIntervalId = null;
    }
    event.waitUntil(clearGpsStateFromIdb());
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
      })
  );
});
