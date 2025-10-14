// ==== CACHE & OFFLINE ====
// ⚠️ Sube la versión al cambiar HTML/CSS/JS
const CACHE_NAME = "alcaldia-tulua-v6";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./logo.png",
];

// Install: precache
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate: limpia cachés viejas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // 1) Navegación: NETWORK-FIRST
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const netRes = await fetch(req);
          const copy = netRes.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return netRes;
        } catch {
          const cached = (await caches.match(req)) || (await caches.match("./index.html"));
          return cached || new Response("Offline", { status: 503 });
        }
      })()
    );
    return;
  }

  // 2) Resto: CACHE-FIRST con actualización
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      const fetchPromise = fetch(req)
        .then((netRes) => {
          if (netRes && netRes.status === 200 && netRes.type !== "opaque") {
            const copy = netRes.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return netRes;
        })
        .catch(() => null);
      return cached || fetchPromise || new Response("", { status: 504 });
    })()
  );
});

// ==== NOTIFICACIONES ====
// Mensaje desde la página para mostrar una notificación
self.addEventListener("message", async (event) => {
  const data = event.data || {};
  if (data.type === "notify" && data.title && data.body) {
    await self.registration.showNotification(data.title, {
      body: data.body,
      icon: "logo.png",
      badge: "logo.png",
      data: { url: data.url || null },
      tag: data.tag || undefined,
      renotify: !!data.tag,
    });
  }
});

// Al tocar la notificación, abre el enlace
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url;
  if (!url) return;

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      // Reusa una pestaña si existe
      for (const client of allClients) {
        try {
          await client.focus();
          await client.navigate(url);
          return;
        } catch { /* no-op */ }
      }
      // O abre una nueva
      if (clients.openWindow) {
        await clients.openWindow(url);
      }
    })()
  );
});
