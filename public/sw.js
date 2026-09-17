// Rebels on Roads - Service Worker for Mobile Tactical Alerts & PWA
// Provides native lock-screen notifications for Android Chrome and iOS (PWA)

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for client messages requesting a system notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// User taps on notification in Android / iOS status bar or lock screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a ride session tab is already open, focus it
      for (const client of windowClients) {
        if (client.url && (client.url.includes('/live-ride') || client.url.includes('/admin/live-rides')) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open the destination URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
