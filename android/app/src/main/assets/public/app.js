/*************************************************
 *  DETECCIÓN PLATAFORMA + PERMISOS/NOTIFICACIONES
 *************************************************/
const isNative = !!window.Capacitor && (
  (window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
  (window.Capacitor.getPlatform && window.Capacitor.getPlatform() !== 'web')
);


/*************************************************
 *  FIREBASE MESSAGING (PUSH)
 *************************************************/
let FirebaseMessaging = null;

if (isNative && window.Capacitor?.Plugins) {
  FirebaseMessaging = window.Capacitor.Plugins.FirebaseMessaging;
}

async function initFirebasePush() {
  try {
    if (!FirebaseMessaging) {
      console.warn("⚠️ FirebaseMessaging plugin no disponible.");
      return;
    }

    // 1️⃣ Pedir permisos
    const permStatus = await FirebaseMessaging.requestPermissions();
    console.log("📱 Permisos push:", permStatus);

    // 2️⃣ Obtener token
    const token = await FirebaseMessaging.getToken();
    console.log("🔥 TOKEN FCM:", token.token);
    await fetch(`${PROXY_BASE}/register_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.token })
    });

    // 3️⃣ Escuchar notificaciones en primer plano
    FirebaseMessaging.addListener("messageReceived", (msg) => {
      console.log("📩 Notificación recibida:", msg);
      const title = msg.notification?.title || "Notificación";
      const body = msg.notification?.body || "Mensaje recibido";
      notifyUnified({ title, body });
    });

    // 🔥 Detectar notificación cuando la app se abre desde el cierre total
FirebaseMessaging.addListener('notificationActionPerformed', (notification) => {
  try {
    const data = notification?.notification?.data;
    const url = data?.url || null;
    console.log('👉 Notificación abierta desde background:', data);
    if (url) {
      window.open(url, '_system'); // abre en navegador externo
      // o usa location.href = url; si quieres dentro de la app
    }
  } catch (e) {
    console.error('❌ Error al abrir notificación:', e);
  }
});


  } catch (err) {
    console.error("❌ Error iniciando FirebaseMessaging:", err);
  }
}



let LocalNotifications = isNative ? (window.Capacitor.Plugins?.LocalNotifications || null) : null;

/*************************************************
 *  CANAL DE NOTIFICACIONES (ANDROID 8+)
 *************************************************/
async function ensureChannel() {
  try {
    if (LocalNotifications?.createChannel) {
      await LocalNotifications.createChannel({
        id: 'default',
        name: 'Notificaciones',
        description: 'Canal por defecto',
        importance: 5
      });
    }
  } catch (e) {
    console.warn('No se pudo crear canal:', e);
  }
}

/*************************************************
 *  PEDIR PERMISOS
 *************************************************/
async function ensureNotificationPermission() {
  try {
    if (isNative && LocalNotifications) {
      await ensureChannel();
      const res = await LocalNotifications.requestPermissions();
      return res?.display === 'granted';
    } else if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const r = await Notification.requestPermission();
        return r === 'granted';
      }
      return Notification.permission === 'granted';
    }
  } catch (e) {
    console.warn('No se pudo pedir permiso:', e);
  }
  return false;
}

/*************************************************
 *  MOSTRAR NOTIFICACIONES
 *************************************************/
async function notifyUnified({ title, body, url, tag }) {
  if (!url) url = null;

  // 🔗 Forzar vista de escritorio agregando parámetro
  if (url && !url.includes("desktop=1")) {
    url += (url.includes("?") ? "&" : "?") + "desktop=1";
  }

  if (isNative && LocalNotifications) {
    const at = new Date(Date.now() + 1000);
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Math.random() * 1e6),
          title,
          body,
          schedule: { at },
          extra: { url: url || null, tag: tag || null }
        }]
      });
    } catch (e) {
      console.error('[Notif][Native] schedule error:', e);
    }
  } else {
    swNotify({ title, body, url, tag });
  }
}

// Clic en notificación nativa
if (isNative && LocalNotifications) {
  LocalNotifications.addListener('localNotificationActionPerformed', (evt) => {
    try {
      const u = evt?.notification?.extra?.url;
      if (u) location.href = u;
    } catch {}
  });
}

/*************************************************
 *  NOTIFICACIONES WEB (Service Worker)
 *************************************************/
function swNotify({ title, body, url, tag }) {
  if (!("serviceWorker" in navigator)) return;
  if (Notification.permission !== "granted") return;
  navigator.serviceWorker.ready.then(async (reg) => {
    const opts = {
      body,
      icon: "logo.png",
      badge: "logo.png",
      data: { url: url || null },
      tag: tag || undefined,
      renotify: !!tag
    };
    if (reg.showNotification) await reg.showNotification(title, opts);
  });
}

/*************************************************
 *  FUENTES A MONITOREAR
 *************************************************/
const SOURCES = [
  { key: "edictos",      url: "https://tulua.gov.co/documentos/5/edictos-y-notificaciones/", title: "Nuevos edictos",      open: "https://tulua.gov.co/documentos/5/edictos-y-notificaciones/" },
  { key: "decretos",     url: "https://tulua.gov.co/documentos/795/decretos/",               title: "Nuevos decretos",     open: "https://tulua.gov.co/documentos/795/decretos/" },
  { key: "resoluciones", url: "https://tulua.gov.co/documentos/796/resoluciones/",           title: "Nuevas resoluciones", open: "https://tulua.gov.co/documentos/796/resoluciones/" },
  { key: "acuerdos",     url: "https://tulua.gov.co/documentos/794/acuerdos/",               title: "Nuevos acuerdos",     open: "https://tulua.gov.co/documentos/794/acuerdos/" },
  { key: "noticias",     url: "https://tulua.gov.co/publicaciones/noticias/?tema=8",         title: "Nuevas noticias",     open: "https://tulua.gov.co/publicaciones/noticias/?tema=8" },
];



/*************************************************
 *  LECTURA Y FIRMA DE PÁGINAS
 *************************************************/
async function fetchHTML(url) {
  const r = await fetch(url, { cache: 'no-store' });
  return await r.text();
}



async function simpleHash(str) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-1", enc.encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/*************************************************
 *  CHEQUEO DE CAMBIOS
 *************************************************/

// 🔧 Dirección del proxy FastAPI en tu servidor IIS o PC
const PROXY_BASE = "https://lunately-cryptogamic-alberta.ngrok-free.dev";

async function getDocListSignature(src) {
  try {
    console.log("🌍 Analizando vía proxy:", src.url);
    const apiUrl = `${PROXY_BASE}/check_docs?url=${encodeURIComponent(src.url)}`;
    const data = await httpGetJson(apiUrl);

    console.log(`🧩 Proxy detectó ${data.count} documentos en ${src.key}`);
    return { hash: data.hash || "", links: Array.isArray(data.links) ? data.links : [] };
  } catch (e) {
    console.error("❌ Error en getDocListSignature (proxy):", e);
    return { hash: "", links: [] };
  }
}


async function checkSource(src) {
  try {
    const KEY_HASH = `lastDocHash:${src.key}`;
    const KEY_SEEN = `seenDocs:${src.key}`;

    const { hash, links } = await getDocListSignature(src);
    const prevHash = localStorage.getItem(KEY_HASH);

    // Si nunca se ha guardado un hash previo, guarda y no notifica
    if (!prevHash) {
      localStorage.setItem(KEY_HASH, hash);
      writeSeen(KEY_SEEN, links);
      console.log(`🆕 Inicializando fuente: ${src.key}`);
      return false;
    }

    // Si el hash cambió, revisa si hay nuevos enlaces
    if (prevHash !== hash) {
      const prevSeen = new Set(readSeen(KEY_SEEN));
      const nuevos = links.filter(u => !prevSeen.has(u));

      localStorage.setItem(KEY_HASH, hash);
      writeSeen(KEY_SEEN, links);

      if (nuevos.length > 0) {
        console.log(`📢 Cambio detectado en ${src.key}: ${nuevos.length} nuevos documentos`);
        await notifyUnified({
          title: src.title,
          body: "Se publicó un nuevo documento. Tócalo para abrir.",
          url: src.open,
          tag: `tag-${src.key}`,
        });
        return true;
      }
    }
  } catch (err) {
    console.warn(`[checkSource] Error en ${src.key}:`, err);
  }
  return false;
}


async function checkAllSourcesForUpdates() {
  try {
    // 👇 Solo muestra mensaje en consola, sin notificar
    console.log("🔍 [Interno] Revisando actualizaciones...");

    let huboCambios = false;

    const resultados = await Promise.allSettled(SOURCES.map(checkSource));
    for (const r of resultados) {
      if (r.value === true) huboCambios = true;
    }

    if (!huboCambios) {
      console.log("✅ [Interno] Sin novedades — No se encontraron nuevas publicaciones.");
    }

    console.log(huboCambios ? "📢 Hay cambios nuevos" : "🟢 Sin novedades");
  } catch (e) {
    console.error("❌ Error al revisar fuentes:", e);
  }
}



/*************************************************
 *  BACKGROUND FETCH (APP CERRADA - APK)
 *************************************************/
if (isNative && window.Capacitor.Plugins?.BackgroundFetch) {
  const { BackgroundFetch, LocalNotifications } = window.Capacitor.Plugins;

  async function setupBackgroundFetch() {
    try {
      const status = await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15, // cada 15 minutos
          stopOnTerminate: false,   // ❗ sigue funcionando si cierras la app
          startOnBoot: true,        // ✅ arranca con el dispositivo
          enableHeadless: true,     // 🔥 permite ejecución en modo cerrado total
          requiredNetworkType: 0,   // cualquier red
        },
        async (taskId) => {
          console.log('🔁 BackgroundFetch ejecutado:', taskId);

          // ejecuta la verificación en segundo plano
          const huboCambios = await checkAllSourcesForUpdates();

          if (huboCambios) {
            await LocalNotifications.schedule({
              notifications: [{
                id: Math.floor(Math.random() * 1e6),
                title: "📢 Nueva publicación detectada",
                body: "Se publicó un nuevo documento.",
              }]
            });
          }

          await BackgroundFetch.finish(taskId);
        },
        async (taskId) => {
          console.log('⚠️ BackgroundFetch timeout:', taskId);
          await BackgroundFetch.finish(taskId);
        }
      );

      console.log('✅ BackgroundFetch configurado correctamente:', status);

      // 🔄 Inicia de inmediato
      const isRunning = await BackgroundFetch.start();
      console.log('🚀 BackgroundFetch iniciado:', isRunning);
    } catch (e) {
      console.error('❌ Error iniciando BackgroundFetch:', e);
    }
  }

  // Ejecuta en nativo (capacitor ready)
  document.addEventListener('deviceready', setupBackgroundFetch, false);
}


/*************************************************
 *  ARRANQUE Y PERIODIC BACKGROUND SYNC (WEB)
 *************************************************/
document.addEventListener("DOMContentLoaded", async () => {


  // Aviso cuando estás sirviendo por HTTP en red local (SW y CORS no funcionarán bien)
  const onHttpLan = location.protocol === 'http:' && !location.hostname.includes('localhost');
  if (!isNative && onHttpLan) {
    console.warn('⚠️ Estás en HTTP sobre red local: el Service Worker requiere HTTPS/localhost y el fetch a dominios externos puede fallar por CORS.');
  }

  console.log("📱 App iniciada, solicitando permisos...");

  await initFirebasePush();

  const granted = await ensureNotificationPermission();

  if (!granted) {
    console.warn("🚫 Permiso de notificaciones no concedido.");
    return;
  }

  console.log("✅ Permiso concedido, iniciando chequeos...");
  await checkAllSourcesForUpdates();

  // Revisión periódica mientras está abierta
  const intervalMs = isNative ? 30 * 1000 : 60 * 1000; // 30s en nativo, 60s en web
  setInterval(async () => {
    console.log("⏱️ Disparando revisión periódica...");
    await checkAllSourcesForUpdates();
  }, intervalMs);

  // 🔁 Background sync (PWA cerrada)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;

      // Preferimos la detección directa en el registro del SW
      if ('periodicSync' in reg) {
        try {
          const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
          if (status.state === 'granted') {
            await reg.periodicSync.register('check-updates', {
              minInterval: 15 * 60 * 1000 // ✅ cada 15 minutos
            });
            console.log('✅ Periodic background sync (15 min) registrado');
          } else {
            console.warn('⚠️ No se otorgó permiso para background sync');
          }
        } catch (e) {
          console.error('❌ Error registrando periodic sync (reg.periodicSync):', e);
        }
      }
      // Compatibilidad con la verificación antigua
      else if ("PeriodicSyncManager" in self) {
        try {
          const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
          if (status.state === 'granted') {
            await reg.periodicSync.register('check-updates', {
              minInterval: 15 * 60 * 1000
            });
            console.log('✅ Periodic background sync (15 min) registrado [fallback]');
          } else {
            console.warn('⚠️ No se otorgó permiso para background sync [fallback]');
          }
        } catch (e) {
          console.error('❌ Error registrando periodic sync [fallback]:', e);
        }
      } else {
        console.warn('ℹ️ periodicSync no está disponible en este navegador/entorno.');
      }
    } catch (e) {
      console.error('❌ Error obteniendo serviceWorker.ready:', e);
    }
  } else {
    console.warn('ℹ️ Service Worker no disponible en este entorno.');
  }
});


/*************************************************
 *  FUNCIONES DE PRUEBA
 *************************************************/
window.forzarCambio = (key = 'edictos') => {
  localStorage.setItem(`lastSig:${key}`, 'x');
  const src = SOURCES.find(s => s.key === key);
  if (src) checkSource(src);
};

window.testNotify = () =>
  notifyUnified({ title: "Prueba", body: "Hola desde notifyUnified", url: "https://tulua.gov.co", tag: "demo" });

/*************************************************
 *  NAVEGACIÓN ENTRE PANTALLAS INTERNAS
 *************************************************/
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}

// Asignar eventos a todos los botones que tengan data-target
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-target]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      goTo(target);
    });
  });
});



/*************************************************
 *  UTIL: HTTP con bypass CORS en nativo (Capacitor 5)
 *************************************************/
const cap = window.Capacitor || {};
const Plugins = cap.Plugins || {};

// Capacitor 5 expone el HTTP oficial así (según build):
// - Plugins.CapacitorHttp  (común)
// - ó cap.CapacitorHttp    (algunas integraciones)
const CapHttp = Plugins.CapacitorHttp || cap.CapacitorHttp || null;

async function httpGetText(url) {
  // Nativo → usa HTTP oficial (sin CORS)
  if (isNative && CapHttp) {
    try {
      const res = await CapHttp.get({ url, connectTimeout: 15000, readTimeout: 15000 });
      return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    } catch (e) {
      console.warn('[HTTP Native] Error:', e);
      throw e;
    }
  }
  // Web → fetch normal (sujeto a CORS)
  const r = await fetch(url, { cache: 'no-store', mode: 'cors' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.text();
}

async function httpGetJson(url) {
  if (isNative && CapHttp) {
    const res = await CapHttp.get({ url, connectTimeout: 15000, readTimeout: 15000 });
    return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  } else {
    const r = await fetch(url, { mode: 'cors', cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  }
}


/*************************************************
 *  PARSEO: extraer enlaces a documentos (mejorado)
 *************************************************/
const DOC_EXT_RE = /\.(pdf|doc|docx|xls|xlsx)(\?|#|$)/i;

function absolutize(href, base) {
  try { return new URL(href, base).href; } catch { return href; }
}

function parseDocLinksFromHTML(html, baseUrl) {
  const docs = new Set();

  // 1️⃣ Buscar href, data-file o src con extensión de documento
  const matches = html.matchAll(/(?:href|data-file|src)\s*=\s*["']([^"']+\.(pdf|docx?|xlsx?))["']/gi);
  for (const m of matches) {
    const abs = absolutize(m[1], baseUrl);
    docs.add(abs);
  }

  // 2️⃣ Buscar URLs embebidas dentro de scripts o JSON
  const jsonMatches = html.matchAll(/https?:\/\/[^\s"'<>]+\.(pdf|docx?|xlsx?)/gi);
  for (const m of jsonMatches) {
    docs.add(m[0]);
  }

  // 3️⃣ Si hay PDFs relativos, convertirlos con base
  const relMatches = html.matchAll(/["']([^"']+\/[^"']+\.(pdf|docx?|xlsx?))["']/gi);
  for (const m of relMatches) {
    const abs = absolutize(m[1], baseUrl);
    docs.add(abs);
  }

  const arr = Array.from(docs).slice(0, 50);
  console.log(`🧩 Detectados ${arr.length} documentos en ${baseUrl}`);
  return arr;
}


/*************************************************
 *  STORAGE helper (clave por fuente)
 *************************************************/
function readSeen(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function writeSeen(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr)); } catch {}
}

