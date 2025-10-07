const CACHE_NAME = "alcaldia-tulua-v3";
const ASSETS = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.json",
  "logo.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(res =>
      res ||
      fetch(req).then(netRes => {
        caches.open(CACHE_NAME).then(c => c.put(req, netRes.clone()));
        return netRes;
      }).catch(() => caches.match("index.html"))
    )
  );
});
