"use strict";

/*************************************************
 * CONFIGURACIÓN GENERAL DE CAPACITOR
 *************************************************/

const CapacitorRuntime = window.Capacitor || {};
const CapacitorPlugins = CapacitorRuntime.Plugins || {};

const platform =
  typeof CapacitorRuntime.getPlatform === "function"
    ? CapacitorRuntime.getPlatform()
    : "web";

const isNative =
  typeof CapacitorRuntime.isNativePlatform === "function"
    ? CapacitorRuntime.isNativePlatform()
    : platform !== "web";

console.log("Plataforma detectada:", platform);
console.log("Ejecución nativa:", isNative);


/*************************************************
 * PLUGINS DE CAPACITOR
 *************************************************/

const FirebaseMessaging =
  isNative && CapacitorPlugins.FirebaseMessaging
    ? CapacitorPlugins.FirebaseMessaging
    : null;

const LocalNotifications =
  isNative && CapacitorPlugins.LocalNotifications
    ? CapacitorPlugins.LocalNotifications
    : null;

const BackgroundFetch =
  isNative && CapacitorPlugins.BackgroundFetch
    ? CapacitorPlugins.BackgroundFetch
    : null;

const BrowserPlugin =
  isNative && CapacitorPlugins.Browser
    ? CapacitorPlugins.Browser
    : null;

const CapHttp =
  CapacitorPlugins.CapacitorHttp ||
  CapacitorRuntime.CapacitorHttp ||
  null;


/*************************************************
 * SERVIDOR PROXY
 *************************************************/

const PROXY_BASE =
  "https://lunately-cryptogamic-alberta.ngrok-free.dev";


/*************************************************
 * FUENTES QUE SE VAN A MONITOREAR
 *************************************************/

const SOURCES = [
  {
    key: "edictos",
    url: "https://tulua.gov.co/documentos/5/edictos-y-notificaciones/",
    title: "Nuevos edictos",
    open: "https://tulua.gov.co/documentos/5/edictos-y-notificaciones/"
  },
  {
    key: "decretos",
    url: "https://tulua.gov.co/documentos/795/decretos/",
    title: "Nuevos decretos",
    open: "https://tulua.gov.co/documentos/795/decretos/"
  },
  {
    key: "resoluciones",
    url: "https://tulua.gov.co/documentos/796/resoluciones/",
    title: "Nuevas resoluciones",
    open: "https://tulua.gov.co/documentos/796/resoluciones/"
  },
  {
    key: "acuerdos",
    url: "https://tulua.gov.co/documentos/794/acuerdos/",
    title: "Nuevos acuerdos",
    open: "https://tulua.gov.co/documentos/794/acuerdos/"
  },
  {
    key: "noticias",
    url: "https://tulua.gov.co/publicaciones/noticias/?tema=8",
    title: "Nuevas noticias",
    open: "https://tulua.gov.co/publicaciones/noticias/?tema=8"
  }
];


/*************************************************
 * APERTURA DE ENLACES
 *************************************************/

async function openExternalUrl(url) {
  if (!url) return;

  try {
    if (isNative && BrowserPlugin?.open) {
      await BrowserPlugin.open({ url });
      return;
    }

    if (isNative) {
      window.location.href = url;
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("Error abriendo la URL:", error);

    try {
      window.location.href = url;
    } catch (fallbackError) {
      console.error(
        "No fue posible abrir la URL:",
        fallbackError
      );
    }
  }
}


/*************************************************
 * FIREBASE MESSAGING
 *************************************************/

let firebaseListenersRegistered = false;

async function registerFirebaseListeners() {
  if (!FirebaseMessaging || firebaseListenersRegistered) {
    return;
  }

  firebaseListenersRegistered = true;

  try {
    await FirebaseMessaging.addListener(
      "messageReceived",
      async (message) => {
        console.log(
          "Notificación Firebase recibida:",
          message
        );

        const title =
          message?.notification?.title ||
          "Notificación";

        const body =
          message?.notification?.body ||
          "Mensaje recibido";

        const url =
          message?.data?.url ||
          message?.notification?.data?.url ||
          null;

        await notifyUnified({
          title,
          body,
          url,
          tag: "firebase-message"
        });
      }
    );

    await FirebaseMessaging.addListener(
      "notificationActionPerformed",
      async (event) => {
        try {
          console.log(
            "Notificación Firebase seleccionada:",
            event
          );

          const data =
            event?.notification?.data ||
            event?.data ||
            {};

          const url = data?.url || null;

          if (url) {
            await openExternalUrl(url);
          }
        } catch (error) {
          console.error(
            "Error procesando la notificación:",
            error
          );
        }
      }
    );
  } catch (error) {
    firebaseListenersRegistered = false;

    console.error(
      "Error registrando listeners de Firebase:",
      error
    );
  }
}


async function registerTokenOnServer(token) {
  if (!token) {
    console.warn(
      "No se recibió un token válido de Firebase."
    );
    return;
  }

  try {
    const response = await fetch(
      `${PROXY_BASE}/register_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token })
      }
    );

    if (!response.ok) {
      throw new Error(
        `El servidor respondió HTTP ${response.status}`
      );
    }

    console.log(
      "Token Firebase registrado en el servidor."
    );
  } catch (error) {
    /*
     * La aplicación puede continuar funcionando aunque
     * el servidor no permita registrar el token.
     */
    console.error(
      "No fue posible registrar el token Firebase:",
      error
    );
  }
}


async function initFirebasePush() {
  if (!isNative) {
    console.log(
      "Firebase Messaging se omite en navegador."
    );
    return false;
  }

  if (!FirebaseMessaging) {
    console.warn(
      "FirebaseMessaging no está disponible."
    );
    return false;
  }

  try {
    await registerFirebaseListeners();

    const permissionStatus =
      await FirebaseMessaging.requestPermissions();

    console.log(
      "Permisos Firebase:",
      permissionStatus
    );

    const permissionGranted =
      permissionStatus?.receive === "granted" ||
      permissionStatus?.display === "granted";

    if (!permissionGranted) {
      console.warn(
        "El permiso para Firebase Messaging no fue concedido."
      );
      return false;
    }

    const tokenResult =
      await FirebaseMessaging.getToken();

    const token = tokenResult?.token || null;

    console.log(
      "Token Firebase obtenido:",
      token
    );

    await registerTokenOnServer(token);

    return true;
  } catch (error) {
    console.error(
      "Error iniciando Firebase Messaging:",
      error
    );

    return false;
  }
}


/*************************************************
 * CANAL DE NOTIFICACIONES DE ANDROID
 *************************************************/

async function ensureChannel() {
  if (!isNative || platform !== "android") {
    return;
  }

  if (!LocalNotifications?.createChannel) {
    return;
  }

  try {
    await LocalNotifications.createChannel({
      id: "default",
      name: "Notificaciones",
      description:
        "Canal principal de notificaciones",
      importance: 5,
      visibility: 1,
      vibration: true
    });

    console.log(
      "Canal de notificaciones creado."
    );
  } catch (error) {
    console.warn(
      "No se pudo crear el canal de notificaciones:",
      error
    );
  }
}


/*************************************************
 * PERMISO DE NOTIFICACIONES
 *************************************************/

async function ensureNotificationPermission() {
  try {
    if (isNative && LocalNotifications) {
      await ensureChannel();

      if (LocalNotifications.checkPermissions) {
        const currentPermission =
          await LocalNotifications.checkPermissions();

        if (
          currentPermission?.display === "granted"
        ) {
          return true;
        }
      }

      const permission =
        await LocalNotifications.requestPermissions();

      return permission?.display === "granted";
    }

    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        return true;
      }

      if (Notification.permission === "denied") {
        return false;
      }

      const result =
        await Notification.requestPermission();

      return result === "granted";
    }
  } catch (error) {
    console.warn(
      "No se pudo solicitar permiso de notificaciones:",
      error
    );
  }

  return false;
}


/*************************************************
 * MOSTRAR NOTIFICACIONES
 *************************************************/

function addDesktopParameter(url) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);

    if (!parsedUrl.searchParams.has("desktop")) {
      parsedUrl.searchParams.set("desktop", "1");
    }

    return parsedUrl.href;
  } catch {
    return url;
  }
}


async function notifyUnified({
  title,
  body,
  url = null,
  tag = null
}) {
  const notificationTitle =
    title || "Notificación";

  const notificationBody =
    body || "Tiene una nueva notificación.";

  const finalUrl = addDesktopParameter(url);

  if (isNative && LocalNotifications) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(
              Date.now() % 2147483647
            ),
            title: notificationTitle,
            body: notificationBody,
            schedule: {
              at: new Date(Date.now() + 1000)
            },
            channelId:
              platform === "android"
                ? "default"
                : undefined,
            extra: {
              url: finalUrl,
              tag
            }
          }
        ]
      });

      console.log(
        "Notificación local programada."
      );
    } catch (error) {
      console.error(
        "Error programando notificación local:",
        error
      );
    }

    return;
  }

  await swNotify({
    title: notificationTitle,
    body: notificationBody,
    url: finalUrl,
    tag
  });
}


/*************************************************
 * CLIC EN NOTIFICACIONES LOCALES
 *************************************************/

let localNotificationListenerRegistered = false;

async function registerLocalNotificationListener() {
  if (
    !isNative ||
    !LocalNotifications ||
    localNotificationListenerRegistered
  ) {
    return;
  }

  try {
    localNotificationListenerRegistered = true;

    await LocalNotifications.addListener(
      "localNotificationActionPerformed",
      async (event) => {
        try {
          const url =
            event?.notification?.extra?.url ||
            null;

          if (url) {
            await openExternalUrl(url);
          }
        } catch (error) {
          console.error(
            "Error procesando notificación local:",
            error
          );
        }
      }
    );
  } catch (error) {
    localNotificationListenerRegistered = false;

    console.error(
      "No se pudo registrar el listener local:",
      error
    );
  }
}


/*************************************************
 * NOTIFICACIONES WEB MEDIANTE SERVICE WORKER
 *************************************************/

async function swNotify({
  title,
  body,
  url,
  tag
}) {
  if (!("serviceWorker" in navigator)) {
    console.warn(
      "Service Worker no disponible."
    );
    return;
  }

  if (
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  try {
    const registration =
      await navigator.serviceWorker.ready;

    await registration.showNotification(
      title,
      {
        body,
        icon: "logo.png",
        badge: "logo.png",
        data: {
          url: url || null
        },
        tag: tag || undefined,
        renotify: Boolean(tag)
      }
    );
  } catch (error) {
    console.error(
      "Error mostrando notificación web:",
      error
    );
  }
}


/*************************************************
 * PETICIONES HTTP
 *************************************************/

async function httpGetText(url) {
  if (isNative && CapHttp) {
    try {
      const response = await CapHttp.get({
        url,
        connectTimeout: 15000,
        readTimeout: 15000
      });

      return typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data);
    } catch (error) {
      console.warn(
        "Error HTTP nativo:",
        error
      );

      throw error;
    }
  }

  const response = await fetch(url, {
    cache: "no-store",
    mode: "cors"
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}`
    );
  }

  return response.text();
}


async function httpGetJson(url) {
  if (isNative && CapHttp) {
    const response = await CapHttp.get({
      url,
      connectTimeout: 15000,
      readTimeout: 15000
    });

    if (typeof response.data === "string") {
      return JSON.parse(response.data);
    }

    return response.data;
  }

  const response = await fetch(url, {
    mode: "cors",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}`
    );
  }

  return response.json();
}


/*************************************************
 * FIRMA DE DOCUMENTOS MEDIANTE EL PROXY
 *************************************************/

async function getDocListSignature(source) {
  try {
    console.log(
      "Analizando fuente mediante proxy:",
      source.url
    );

    const apiUrl =
      `${PROXY_BASE}/check_docs?url=` +
      encodeURIComponent(source.url);

    const data = await httpGetJson(apiUrl);

    const links =
      Array.isArray(data?.links)
        ? data.links
        : [];

    console.log(
      `El proxy detectó ${data?.count || links.length} documentos en ${source.key}.`
    );

    return {
      hash: data?.hash || "",
      links
    };
  } catch (error) {
    console.error(
      `Error analizando ${source.key}:`,
      error
    );

    return {
      hash: "",
      links: []
    };
  }
}


/*************************************************
 * STORAGE
 *************************************************/

function readSeen(key) {
  try {
    return JSON.parse(
      localStorage.getItem(key) || "[]"
    );
  } catch {
    return [];
  }
}


function writeSeen(key, values) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(values)
    );
  } catch (error) {
    console.warn(
      "No se pudo guardar información local:",
      error
    );
  }
}


/*************************************************
 * COMPROBACIÓN DE CADA FUENTE
 *************************************************/

async function checkSource(source) {
  try {
    const hashKey =
      `lastDocHash:${source.key}`;

    const seenKey =
      `seenDocs:${source.key}`;

    const { hash, links } =
      await getDocListSignature(source);

    /*
     * No actualizamos el almacenamiento si el proxy
     * respondió sin hash. Esto evita falsas detecciones.
     */
    if (!hash) {
      console.warn(
        `No se obtuvo un hash válido para ${source.key}.`
      );

      return false;
    }

    const previousHash =
      localStorage.getItem(hashKey);

    /*
     * Primera ejecución:
     * se almacena el estado actual sin notificar.
     */
    if (!previousHash) {
      localStorage.setItem(hashKey, hash);
      writeSeen(seenKey, links);

      console.log(
        `Fuente inicializada: ${source.key}`
      );

      return false;
    }

    if (previousHash === hash) {
      return false;
    }

    const previouslySeen =
      new Set(readSeen(seenKey));

    const newLinks = links.filter(
      (link) => !previouslySeen.has(link)
    );

    localStorage.setItem(hashKey, hash);
    writeSeen(seenKey, links);

    if (newLinks.length === 0) {
      console.log(
        `Cambió ${source.key}, pero no se identificaron enlaces nuevos.`
      );

      return false;
    }

    console.log(
      `${newLinks.length} documentos nuevos en ${source.key}.`
    );

    await notifyUnified({
      title: source.title,
      body:
        newLinks.length === 1
          ? "Se publicó un nuevo documento. Tócalo para abrir."
          : `Se publicaron ${newLinks.length} documentos nuevos.`,
      url: source.open,
      tag: `tag-${source.key}`
    });

    return true;
  } catch (error) {
    console.warn(
      `Error comprobando ${source.key}:`,
      error
    );

    return false;
  }
}


/*************************************************
 * COMPROBACIÓN DE TODAS LAS FUENTES
 *************************************************/

let checkInProgress = false;

async function checkAllSourcesForUpdates() {
  if (checkInProgress) {
    console.log(
      "Ya existe una comprobación en curso."
    );

    return false;
  }

  checkInProgress = true;

  try {
    console.log(
      "Revisando actualizaciones..."
    );

    const results =
      await Promise.allSettled(
        SOURCES.map(checkSource)
      );

    let changesFound = false;

    for (const result of results) {
      if (
        result.status === "fulfilled" &&
        result.value === true
      ) {
        changesFound = true;
      }
    }

    console.log(
      changesFound
        ? "Se encontraron novedades."
        : "No se encontraron novedades."
    );

    /*
     * Este return faltaba en el archivo anterior.
     * Background Fetch necesita recibir este valor.
     */
    return changesFound;
  } catch (error) {
    console.error(
      "Error revisando las fuentes:",
      error
    );

    return false;
  } finally {
    checkInProgress = false;
  }
}


/*************************************************
 * BACKGROUND FETCH
 *************************************************/

let backgroundFetchConfigured = false;

async function setupBackgroundFetch() {
  if (
    !isNative ||
    !BackgroundFetch ||
    backgroundFetchConfigured
  ) {
    return;
  }

  try {
    backgroundFetchConfigured = true;

    const status =
      await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15,
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true,
          requiredNetworkType: 0
        },

        async (taskId) => {
          console.log(
            "Background Fetch ejecutado:",
            taskId
          );

          try {
            await checkAllSourcesForUpdates();
          } catch (error) {
            console.error(
              "Error dentro de Background Fetch:",
              error
            );
          } finally {
            await BackgroundFetch.finish(taskId);
          }
        },

        async (taskId) => {
          console.warn(
            "Background Fetch agotó el tiempo:",
            taskId
          );

          await BackgroundFetch.finish(taskId);
        }
      );

    console.log(
      "Background Fetch configurado:",
      status
    );

    if (BackgroundFetch.start) {
      const startResult =
        await BackgroundFetch.start();

      console.log(
        "Background Fetch iniciado:",
        startResult
      );
    }
  } catch (error) {
    backgroundFetchConfigured = false;

    console.error(
      "Error configurando Background Fetch:",
      error
    );
  }
}


/*************************************************
 * PERIODIC BACKGROUND SYNC WEB
 *************************************************/

async function setupPeriodicWebSync() {
  if (
    isNative ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  try {
    const registration =
      await navigator.serviceWorker.ready;

    if (!registration.periodicSync) {
      console.warn(
        "Periodic Sync no está disponible."
      );

      return;
    }

    let permissionGranted = false;

    try {
      const permissionStatus =
        await navigator.permissions.query({
          name: "periodic-background-sync"
        });

      permissionGranted =
        permissionStatus.state === "granted";
    } catch (error) {
      console.warn(
        "No fue posible consultar el permiso de Periodic Sync:",
        error
      );
    }

    if (!permissionGranted) {
      console.warn(
        "Periodic Sync no tiene permiso."
      );

      return;
    }

    await registration.periodicSync.register(
      "check-updates",
      {
        minInterval: 15 * 60 * 1000
      }
    );

    console.log(
      "Periodic Sync registrado."
    );
  } catch (error) {
    console.error(
      "Error registrando Periodic Sync:",
      error
    );
  }
}


/*************************************************
 * NAVEGACIÓN ENTRE PANTALLAS
 *************************************************/

function goTo(screenId) {
  const target =
    document.getElementById(screenId);

  if (!target) {
    console.error(
      `No existe la pantalla: ${screenId}`
    );

    return;
  }

  document
    .querySelectorAll(".screen")
    .forEach((screen) => {
      const isTarget =
        screen.id === screenId;

      screen.classList.toggle(
        "active",
        isTarget
      );

      screen.setAttribute(
        "aria-hidden",
        isTarget ? "false" : "true"
      );
    });

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto"
  });

  const firstHeading =
    target.querySelector("h1, h2");

  if (firstHeading) {
    firstHeading.setAttribute(
      "tabindex",
      "-1"
    );

    firstHeading.focus({
      preventScroll: true
    });
  }
}


function setupInternalNavigation() {
  document
    .querySelectorAll("[data-target]")
    .forEach((element) => {
      element.addEventListener(
        "click",
        () => {
          const target =
            element.dataset.target;

          if (target) {
            goTo(target);
          }
        }
      );
    });

  document
    .querySelectorAll(".screen")
    .forEach((screen) => {
      screen.setAttribute(
        "aria-hidden",
        screen.classList.contains("active")
          ? "false"
          : "true"
      );
    });
}


/*************************************************
 * REVISIÓN PERIÓDICA CON LA APP ABIERTA
 *************************************************/

let foregroundInterval = null;

function startForegroundChecks() {
  if (foregroundInterval) {
    clearInterval(foregroundInterval);
  }

  /*
   * Durante desarrollo puede usarse un intervalo corto.
   * En producción se recomienda no consultar cada 30 segundos.
   */
  const intervalMilliseconds =
    isNative
      ? 5 * 60 * 1000
      : 10 * 60 * 1000;

  foregroundInterval = setInterval(
    async () => {
      console.log(
        "Ejecutando revisión periódica..."
      );

      await checkAllSourcesForUpdates();
    },
    intervalMilliseconds
  );
}


/*************************************************
 * INICIALIZACIÓN
 *************************************************/

async function initializeApplication() {
  setupInternalNavigation();

  const runningOnHttpLan =
    location.protocol === "http:" &&
    !["localhost", "127.0.0.1"].includes(
      location.hostname
    );

  if (!isNative && runningOnHttpLan) {
    console.warn(
      "La aplicación está ejecutándose por HTTP en red local. Service Worker y CORS pueden fallar."
    );
  }

  console.log(
    "Inicializando aplicación..."
  );

  await registerLocalNotificationListener();

  /*
   * Firebase y notificaciones locales solicitan permisos
   * de manera independiente.
   */
  await initFirebasePush();

  const notificationGranted =
    await ensureNotificationPermission();

  if (!notificationGranted) {
    console.warn(
      "El permiso de notificaciones no fue concedido. La aplicación continuará funcionando sin avisos locales."
    );
  }

  /*
   * Aunque el permiso sea rechazado, continuamos
   * configurando navegación y funcionamiento general.
   */
  await setupBackgroundFetch();

  if (notificationGranted) {
    await checkAllSourcesForUpdates();
    startForegroundChecks();
  }

  await setupPeriodicWebSync();

  console.log(
    "Aplicación inicializada."
  );
}


document.addEventListener(
  "DOMContentLoaded",
  initializeApplication
);


/*************************************************
 * FUNCIONES DE PRUEBA
 *************************************************/

window.forzarCambio = async (
  key = "edictos"
) => {
  const source =
    SOURCES.find(
      (item) => item.key === key
    );

  if (!source) {
    console.error(
      `No existe la fuente: ${key}`
    );

    return false;
  }

  /*
   * La clave correcta es lastDocHash,
   * no lastSig.
   */
  localStorage.setItem(
    `lastDocHash:${key}`,
    `prueba-${Date.now()}`
  );

  console.log(
    `Cambio forzado para ${key}.`
  );

  return checkSource(source);
};


window.testNotify = async () => {
  return notifyUnified({
    title: "Prueba",
    body:
      "Hola desde la aplicación de la Alcaldía de Tuluá.",
    url: "https://tulua.gov.co",
    tag: `demo-${Date.now()}`
  });
};


window.checkUpdates = async () => {
  return checkAllSourcesForUpdates();
};


/*************************************************
 * UTILIDADES PARA EXTRAER DOCUMENTOS
 * Se conservan para pruebas futuras.
 *************************************************/

const DOC_EXT_RE =
  /\.(pdf|doc|docx|xls|xlsx)(\?|#|$)/i;


function absolutize(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}


function parseDocLinksFromHTML(
  html,
  baseUrl
) {
  const documents = new Set();

  const attributeMatches =
    html.matchAll(
      /(?:href|data-file|src)\s*=\s*["']([^"']+\.(pdf|docx?|xlsx?)(?:[?#][^"']*)?)["']/gi
    );

  for (const match of attributeMatches) {
    const absoluteUrl =
      absolutize(match[1], baseUrl);

    documents.add(absoluteUrl);
  }

  const absoluteMatches =
    html.matchAll(
      /https?:\/\/[^\s"'<>]+\.(pdf|docx?|xlsx?)(?:[?#][^\s"'<>]*)?/gi
    );

  for (const match of absoluteMatches) {
    documents.add(match[0]);
  }

  const relativeMatches =
    html.matchAll(
      /["']([^"']+\/[^"']+\.(pdf|docx?|xlsx?)(?:[?#][^"']*)?)["']/gi
    );

  for (const match of relativeMatches) {
    const absoluteUrl =
      absolutize(match[1], baseUrl);

    documents.add(absoluteUrl);
  }

  const result =
    Array.from(documents).slice(0, 50);

  console.log(
    `Se detectaron ${result.length} documentos en ${baseUrl}.`
  );

  return result;
}
/*************************************************
 * EVENTOS - ¿QUÉ HAY PARA HACER?
 *************************************************/

const EVENTOS = [
  {
    id: "cuarto-milla",
    nombre: "Cuarto de Milla Tuluá",
    categoria: "Deportivo",
    fecha: "17 y 18 de octubre de 2026",
    lugar: "Tuluá, Valle del Cauca",
    descripcion: "Evento de velocidad y motores que reúne a los amantes de la adrenalina en pruebas de cuarto de milla.",
    imagen: "https://tulua.gov.co/info/tulua_se/media/galeria12262.jpg"
  },
  {
    id: "expo-feria-deportiva",
    nombre: "Expo Feria Deportiva",
    categoria: "Deportivo",
    fecha: "14 y 15 de noviembre de 2026",
    lugar: "Coliseo de Ferias Manuel Victoria Rojas",
    descripcion: "Exposición de las principales marcas en ropa y elementos para running y actividad física.",
    imagen: "https://tulua.gov.co/info/tulua_se/media/galeria11641.png"
  },
  {
    id: "expo-cafes",
    nombre: "Exposición de Cafés Especiales del Valle del Cauca",
    categoria: "Cultural",
    fecha: "Edición anual (última: 25 y 26 de abril de 2026)",
    lugar: "Supercentro Tuluá",
    descripcion: "Feria regional que reúne caficultores y productores para destacar los cafés de especialidad del Valle del Cauca.",
    imagen: null
  },
  {
    id: "media-maraton",
    nombre: "Media Maratón Tuluá",
    categoria: "Deportivo",
    fecha: "15 de noviembre de 2026",
    lugar: "Coliseo de Ferias Manuel Victoria Rojas",
    descripcion: "Competencia atlética de 5, 10 y 21 km que promueve la vida saludable, el turismo y la economía local.",
    imagen: "https://tulua.gov.co/info/tulua_se/media/galeria11764.jpg"
  },
  {
    id: "rotary-run",
    nombre: "Carrera Atlética Rotary Run",
    categoria: "Deportivo",
    fecha: "Edición anual (última: 19 de abril de 2026)",
    lugar: "Tuluá, Valle del Cauca",
    descripcion: "Carrera solidaria e inclusiva organizada por el Club Rotario El Lago, con categorías de 3K, 5K y 10.5K.",
    imagen: "https://tulua.gov.co/info/tulua_se/media/galeria11581.jpg"
  },
  {
    id: "feria-tulua",
    nombre: "Feria de Tuluá",
    categoria: "Cultural",
    fecha: "Fiesta tradicional anual",
    lugar: "Coliseo de Ferias Manuel Victoria Rojas",
    descripcion: "La fiesta cultural más importante del centro del Valle del Cauca, con desfiles, exposición equina, ganadera y pueblito artesanal.",
    imagen: "https://tulua.gov.co/info/tulua_se/media/galeria12029.jpg"
  },
  {
    id: "feria-agroturismo",
    nombre: "Feria Agroturismo y Negocios Sostenibles",
    categoria: "Empresarial",
    fecha: "Próxima fecha por confirmar",
    lugar: "Supercentro Tuluá",
    descripcion: "Evento que conecta productores del campo, empresarios y emprendedores para impulsar el turismo sostenible.",
    imagen: "https://tulua.gov.co/info/tulua_se/media/galeria11473.jpg"
  },
  {
    id: "networking-summit",
    nombre: "UCEVA Networking Summit",
    categoria: "Empresarial",
    fecha: "7 al 11 de septiembre de 2026",
    lugar: "Campus Universitario UCEVA",
    descripcion: "Espacio de conexión e innovación para estudiantes, profesionales, emprendedores y líderes de la región.",
    imagen: "https://tulua.gov.co/info/tulua_se/media/galeria11584.jpg"
  },
  {
    id: "santa-cecilia",
    nombre: "Festival de Música Santa Cecilia",
    categoria: "Cultural",
    fecha: "19 al 22 de noviembre de 2026",
    lugar: "Casa de la Cultura, Tuluá",
    descripcion: "Tradicional festival de música andina, clásica y popular en homenaje a la patrona de los músicos.",
    imagen: "https://tulua.gov.co/info/tulua_se/media/galeria11604.jpg"
  }
];

function obtenerFavoritos() {
  try {
    const raw = localStorage.getItem("eventos_favoritos");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function guardarFavoritos(favoritos) {
  localStorage.setItem("eventos_favoritos", JSON.stringify(favoritos));
}

function alternarFavorito(id) {
  const favoritos = obtenerFavoritos();
  const index = favoritos.indexOf(id);

  if (index >= 0) {
    favoritos.splice(index, 1);
  } else {
    favoritos.push(id);
  }

  guardarFavoritos(favoritos);
  renderEventos();
}

function generarICS(evento) {
  const texto = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    "SUMMARY:" + evento.nombre,
    "DESCRIPTION:" + evento.descripcion,
    "LOCATION:" + evento.lugar,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return "data:text/calendar;charset=utf8," + encodeURIComponent(texto);
}

function generarLinkMapa(evento) {
  const query = encodeURIComponent(evento.lugar + ", Tuluá, Valle del Cauca, Colombia");
  return "https://maps.apple.com/?q=" + query;
}

let soloFavoritos = false;

function renderEventos() {
  const contenedor = document.getElementById("eventos-grid");
  if (!contenedor) return;

  const favoritos = obtenerFavoritos();
  const lista = soloFavoritos
    ? EVENTOS.filter((e) => favoritos.includes(e.id))
    : EVENTOS;

  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML =
      '<p class="eventos-vacio">Aún no tienes eventos favoritos. Toca la estrella de un evento para guardarlo aquí.</p>';
    return;
  }

  lista.forEach((evento) => {
    const esFavorito = favoritos.includes(evento.id);
    const card = document.createElement("article");
    card.className = "evento-card";

    card.innerHTML =
      (evento.imagen
        ? '<img class="evento-img" src="' + evento.imagen + '" alt="' + evento.nombre + '" />'
        : '<div class="evento-img evento-img-placeholder">🎉</div>') +
      '<div class="evento-body">' +
        '<span class="evento-categoria">' + evento.categoria + '</span>' +
        '<h3 class="evento-nombre">' + evento.nombre + '</h3>' +
        '<p class="evento-fecha">📅 ' + evento.fecha + '</p>' +
        '<p class="evento-lugar">📍 ' + evento.lugar + '</p>' +
        '<p class="evento-desc">' + evento.descripcion + '</p>' +
        '<div class="evento-acciones">' +
          '<button type="button" class="btn-evento btn-favorito" data-id="' + evento.id + '">' +
            (esFavorito ? "⭐ Guardado" : "☆ Favorito") +
          '</button>' +
          '<a class="btn-evento" href="' + generarLinkMapa(evento) + '" target="_blank" rel="noopener noreferrer">📍 Cómo llegar</a>' +
          '<a class="btn-evento" href="' + generarICS(evento) + '" target="_blank" rel="noopener noreferrer">📅 Agregar a calendario</a>' +
        '</div>' +
      '</div>';

    contenedor.appendChild(card);
  });

  contenedor.querySelectorAll(".btn-favorito").forEach((btn) => {
    btn.addEventListener("click", () => {
      alternarFavorito(btn.dataset.id);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderEventos();

  const btnFiltro = document.getElementById("btn-filtro-favoritos");
  if (btnFiltro) {
    btnFiltro.addEventListener("click", () => {
      soloFavoritos = !soloFavoritos;
      btnFiltro.classList.toggle("activo", soloFavoritos);
      btnFiltro.textContent = soloFavoritos
        ? "⭐ Ver todos"
        : "⭐ Ver mis favoritos";
      renderEventos();
    });
  }
});
