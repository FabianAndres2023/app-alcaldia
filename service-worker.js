// ⚠️ Sube la versión al cambiar HTML/CSS/JS
const CACHE_NAME = "alcaldia-tulua-v5";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./logo.png"
];

// Install: precache
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate: limpia cachés viejas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // 1) Trato TODA navegación como NETWORK-FIRST (sin suposiciones de path)
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const netRes = await fetch(req);
        // Guarda EXACTAMENTE la URL solicitada, no "./index.html"
        const copy = netRes.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return netRes;
      } catch {
        // Offline: cae a lo cacheado (misma URL o index de reserva)
        const cached = await caches.match(req) || await caches.match("./index.html");
        return cached || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // 2) Resto: CACHE-FIRST con actualización en segundo plano
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const fetchPromise = fetch(req).then(netRes => {
      if (netRes && netRes.status === 200 && netRes.type !== "opaque") {
        const copy = netRes.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
      }
      return netRes;
    }).catch(() => null);
    return cached || fetchPromise || new Response("", { status: 504 });
  })());
});
