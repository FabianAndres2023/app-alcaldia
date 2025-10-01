const CACHE_NAME = "alcaldia-tulua-v1";
const urlsToCache = [
  "/",                // raíz
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.json",
  "/logo.png"
];

// Instalación: cachea los archivos base
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // fuerza a activar el SW inmediatamente
});

// Activación: limpia caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim(); // controla todas las páginas abiertas
});

// Intercepta las peticiones
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si está en cache, devuelve cache; si no, pide a la red
      return (
        response ||
        fetch(event.request).catch(() => {
          // Offline fallback: si quieres, aquí puedes devolver un HTML de error
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        })
      );
    })
  );
});
