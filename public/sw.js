const CACHE_NAME = "invoyr-v1";
const PRECACHE_URLS = ["/offline", "/main-logo.svg", "/main-logo-dark.svg", "/favicon.png"];

// Install: precache the offline page and key static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests from the same origin
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API routes: never intercept — always go to network
  if (url.pathname.startsWith("/api/")) return;

  // Next.js build assets: cache-first (they're content-hashed, safe to cache forever)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached ?? fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
      )
    );
    return;
  }

  // Static public assets: cache-first
  const staticExts = [".svg", ".png", ".ico", ".jpg", ".webp", ".woff2", ".woff", ".ttf"];
  if (staticExts.some((ext) => url.pathname.endsWith(ext))) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached ?? fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
      )
    );
    return;
  }

  // Navigation requests: network-first, fall back to offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then((res) => res ?? new Response("Offline", { status: 503 }))
      )
    );
    return;
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: "Invoyr", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Invoyr", {
      body: data.body ?? "",
      icon: "/favicon.png",
      badge: "/favicon.png",
      vibrate: [100, 50, 100],
      data: { url: data.url ?? "/dashboard" },
    })
  );
});

// Notification click: focus existing window or open new one
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
      const existing = all.find((c) => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return clients.openWindow(targetUrl);
    })
  );
});
