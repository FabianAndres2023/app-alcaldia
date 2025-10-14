// ==== CACHE & OFFLINE ====
const CACHE_NAME = "alcaldia-tulua-v9";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./logo.png",
];

// ===== INSTALL =====
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

// ===== ACTIVATE =====
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ===== FETCH =====
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

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

  // Cache-first
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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let url = event.notification?.data?.url;
  if (!url) return;

  // Forzar vista escritorio
  if (!url.includes("desktop=1")) {
    url += (url.includes("?") ? "&" : "?") + "desktop=1";
  }

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        try {
          await client.focus();
          await client.navigate(url);
          return;
        } catch {}
      }
      if (clients.openWindow) await clients.openWindow(url);
    })()
  );
});


// ==== PERIODIC BACKGROUND SYNC ====
self.addEventListener("periodicsync", async (event) => {
  if (event.tag === "check-updates") {
    console.log("🔄 Ejecutando revisión en segundo plano (PWA)");
    event.waitUntil(runBackgroundCheck());
  }
});

// ==== FUNCIÓN PRINCIPAL DE REVISIÓN ====
async function runBackgroundCheck() {
  try {
    // 🔔 Mostrar notificación “Revisando...”
    await self.registration.showNotification("🔍 Revisando actualizaciones...", {
      body: "Verificando nuevas publicaciones en el portal de la Alcaldía...",
      icon: "logo.png",
      badge: "logo.png",
      silent: true,
      tag: "revisando",
      renotify: true,
    });

    // Revisar fuentes
    const huboCambios = await checkForUpdatesSW();

    // 🔕 Cerrar notificación “revisando”
    const reviewing = await self.registration.getNotifications({ tag: "revisando" });
    reviewing.forEach((n) => n.close());

    // Si no hubo cambios, muestra “Sin novedades”
    if (!huboCambios) {
      await self.registration.showNotification("✅ Sin novedades", {
        body: "No se encontraron nuevas publicaciones.",
        icon: "logo.png",
        badge: "logo.png",
        tag: "sin-novedades",
        silent: true,
      });

      // Se auto-cierra después de 3 segundos
      setTimeout(async () => {
        const notis = await self.registration.getNotifications({ tag: "sin-novedades" });
        for (const n of notis) n.close();
      }, 3000);
    }
  } catch (e) {
    console.error("❌ Error en revisión background:", e);
  }
}

// ==== FUNCIÓN QUE DETECTA CAMBIOS ====
async function checkForUpdatesSW() {
  let huboCambios = false;
  const sources = [
    { key: "edictos", url: "https://tulua.gov.co/documentos/5/edictos-y-notificaciones/", title: "Nuevos edictos", open: "https://tulua.gov.co/documentos/5/edictos-y-notificaciones/" },
    { key: "noticias", url: "https://tulua.gov.co/publicaciones/noticias/?tema=8", title: "Nuevas noticias", open: "https://tulua.gov.co/publicaciones/noticias/?tema=8" },
    { key: "decretos", url: "https://tulua.gov.co/documentos/795/decretos/", title: "Nuevos decretos", open: "https://tulua.gov.co/documentos/795/decretos/" },
    { key: "resoluciones", url: "https://tulua.gov.co/documentos/796/resoluciones/", title: "Nuevas resoluciones", open: "https://tulua.gov.co/documentos/796/resoluciones/" },
    { key: "acuerdos", url: "https://tulua.gov.co/documentos/794/acuerdos/", title: "Nuevos acuerdos", open: "https://tulua.gov.co/documentos/794/acuerdos/" },
  ];

  for (const src of sources) {
    try {
      const res = await fetch(src.url, { cache: "no-store" });
      const text = await res.text();
      const hashBuffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text.slice(0, 4000)));
      const sig = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const key = `lastSig:${src.key}`;
      const prev = (await self.registration.storage?.getItem?.(key)) || null;

      if (prev && prev !== sig) {
        huboCambios = true;
        console.log(`📢 Cambio detectado en ${src.key}`);
        await self.registration.showNotification(src.title, {
          body: "Se publicaron actualizaciones. Tócalo para ver.",
          icon: "logo.png",
          badge: "logo.png",
          data: { url: src.open },
        });
      }

      self.registration.storage?.setItem?.(key, sig);
    } catch (e) {
      console.warn("⚠️ Error revisando", src.key, e);
    }
  }

  return huboCambios;
}
