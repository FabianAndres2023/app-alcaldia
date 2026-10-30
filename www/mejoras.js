/*************************************************
 * ENLACES DENTRO DE LA APLICACIÓN
 * En iPhone/iPad los enlaces web se abren en una
 * vista dentro de la app (con botón para cerrar),
 * sin salir a Safari. Los mapas, llamadas y correos
 * siguen usando las apps del sistema.
 *************************************************/

document.addEventListener(
  "click",
  function (evento) {
    var objetivo = evento.target;
    if (!objetivo || typeof objetivo.closest !== "function") return;

    var enlace = objetivo.closest("a[href]");
    if (!enlace) return;

    var destino = enlace.getAttribute("href") || "";

    if (!/^https?:\/\//i.test(destino)) return;
    if (/^https?:\/\/maps\.apple\.com/i.test(destino)) return;

    if (typeof isNative === "undefined" || !isNative) return;
    if (typeof BrowserPlugin === "undefined" || !BrowserPlugin) return;
    if (typeof openExternalUrl !== "function") return;

    evento.preventDefault();
    openExternalUrl(destino);
  },
  true
);
