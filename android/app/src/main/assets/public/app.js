/*************************************************
 *  DETECCIÓN PLATAFORMA + PERMISOS/NOTIFICACIONES
 *************************************************/
const isNative = !!window.Capacitor && (
  (window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
  (window.Capacitor.getPlatform && window.Capacitor.getPlatform() !== 'web')
);

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
  { key: "edictos", url: "https://tulua.gov.co/documentos/5/edictos-y-notificaciones/", title: "Nuevos edictos", open: "https://tulua.gov.co/documentos/5/edictos-y-notificaciones/" },
  { key: "noticias", url: "https://tulua.gov.co/publicaciones/noticias/?tema=8", title: "Nuevas noticias", open: "https://tulua.gov.co/publicaciones/noticias/?tema=8" },
  { key: "decretos", url: "https://tulua.gov.co/documentos/795/decretos/", title: "Nuevos decretos", open: "https://tulua.gov.co/documentos/795/decretos/" },
  { key: "resoluciones", url: "https://tulua.gov.co/documentos/796/resoluciones/", title: "Nuevas resoluciones", open: "https://tulua.gov.co/documentos/796/resoluciones/" },
  { key: "acuerdos", url: "https://tulua.gov.co/documentos/794/acuerdos/", title: "Nuevos acuerdos", open: "https://tulua.gov.co/documentos/794/acuerdos/" },
];

/*************************************************
 *  LECTURA Y FIRMA DE PÁGINAS
 *************************************************/
async function fetchHTML(url) {
  const r = await fetch(url, { cache: 'no-store' });
  return await r.text();
}

async function getSignatureFromPage(url) {
  const text = await fetchHTML(url);
  const dateMatch = text.match(/(\d{4}[-/]\d{2}[-/]\d{2}|\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b)/);
  const datePart = dateMatch ? dateMatch[0] : "";
  const firstLink = (text.match(/href="([^"]+)"/i) || [, ""])[1];
  const hash = await simpleHash(text.slice(0, 6000));
  return `${datePart}|${firstLink}|${hash}`;
}

async function simpleHash(str) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-1", enc.encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/*************************************************
 *  CHEQUEO DE CAMBIOS
 *************************************************/
async function checkSource(src) {
  try {
    const sig = await getSignatureFromPage(src.url);
    const KEY = `lastSig:${src.key}`;
    const prev = localStorage.getItem(KEY);
    if (prev && prev === sig) return false;
    localStorage.setItem(KEY, sig);
    if (prev) {
      await notifyUnified({
        title: src.title,
        body: "Se publicaron actualizaciones. Tócalo para ver.",
        url: src.open,
        tag: `tag-${src.key}`,
      });
      return true;
    }
  } catch (err) {
    console.warn(`[checkSource] Error en ${src.key}:`, err);
  }
  return false;
}

async function checkAllSourcesForUpdates() {
  try {
    if (isNative && LocalNotifications) {
      await LocalNotifications.schedule({
        notifications: [{
          id: 9999,
          title: "🔍 Revisando actualizaciones...",
          body: "Verificando nuevas publicaciones...",
        }]
      });
    }

    console.log("🕒 Revisando fuentes...");
    let huboCambios = false;

    const resultados = await Promise.allSettled(SOURCES.map(checkSource));
    for (const r of resultados) {
      if (r.value === true) huboCambios = true;
    }

    if (isNative && LocalNotifications && !huboCambios) {
      await LocalNotifications.schedule({
        notifications: [{
          id: 10000,
          title: "✅ Sin novedades",
          body: "No se encontraron nuevas publicaciones.",
        }]
      });
      setTimeout(async () => {
        await LocalNotifications.cancel({ notifications: [{ id: 10000 }] });
      }, 3000);
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
  const { BackgroundFetch } = window.Capacitor.Plugins;
  async function setupBackgroundFetch() {
    try {
      const status = await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15, // ✅ cada 15 minutos
          stopOnTerminate: false,
          startOnBoot: true,
          requiredNetworkType: 0,
        },
        async (taskId) => {
          console.log('🔁 BackgroundFetch ejecutado:', taskId);
          await checkAllSourcesForUpdates();
          await BackgroundFetch.finish(taskId);
        },
        async (taskId) => {
          console.log('⚠️ BackgroundFetch timeout:', taskId);
          await BackgroundFetch.finish(taskId);
        }
      );
      console.log('✅ BackgroundFetch configurado correctamente:', status);
    } catch (e) {
      console.error('❌ Error iniciando BackgroundFetch:', e);
    }
  }
  document.addEventListener('deviceready', setupBackgroundFetch, false);
}

/*************************************************
 *  ARRANQUE Y PERIODIC BACKGROUND SYNC (WEB)
 *************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📱 App iniciada, solicitando permisos...");
  const granted = await ensureNotificationPermission();

  if (!granted) {
    console.warn("🚫 Permiso de notificaciones no concedido.");
    return;
  }

  console.log("✅ Permiso concedido, iniciando chequeos...");
  await checkAllSourcesForUpdates();

  // Revisión cada 30 segundos mientras está abierta
  setInterval(async () => {
    console.log("⏱️ Disparando revisión periódica...");
    await checkAllSourcesForUpdates();
  }, 30 * 1000);

  // 🔁 Background sync (PWA cerrada)
  if ("serviceWorker" in navigator && "PeriodicSyncManager" in self) {
    navigator.serviceWorker.ready.then(async (reg) => {
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
        console.error('❌ Error registrando periodic sync:', e);
      }
    });
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
