// Sube la versión para forzar actualización del SW cuando cambies algo
const CACHE_NAME = "alcaldia-tulua-v3";

// Resuelve rutas respecto al scope (p. ej. https://.../app-alcaldia/)
const resolve = (path) => new URL(path, self.registration.scope).toString();

const ASSETS = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.json",
  "logo.png"
].map(resolve);

// INSTALL: cachea assets base
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// ACTIVATE: limpia caches viejos y habilita navigation preload
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)));
    if ("navigationPreload" in self.registration) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

// FETCH:
//  - Navegación: network-first, fallback a cache y luego a index.html offline.
//  - Recursos same-origin: cache-first con actualización en background.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;

        const net = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, net.clone());
        return net;
      } catch {
        const cached = await caches.match(request);
        return cached || caches.match(resolve("index.html"));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) {
      caches.open(CACHE_NAME).then(cache =>
        fetch(request).then(resp => cache.put(request, resp.clone())).catch(() => {})
      );
      return cached;
    }
    try {
      const resp = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, resp.clone());
      return resp;
    } catch {
      if (request.destination === "document") {
        return caches.match(resolve("index.html"));
      }
      return new Response("", { status: 504, statusText: "Offline" });
    }
  })());
});
