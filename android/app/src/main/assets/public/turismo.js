/*************************************************
 * TURISMO - ¿QUÉ HAY PARA VISITAR?
 * y pantalla MIS FAVORITOS
 *************************************************/

(function () {
  "use strict";

  var CLAVE_FAVORITOS = "turismo_favoritos";

  var estado = {
    categoria: "Todos",
    soloFavoritos: false,
    texto: ""
  };

  /* ---------- utilidades ---------- */

  function el(etiqueta, clase, texto) {
    var nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined && texto !== null) nodo.textContent = texto;
    return nodo;
  }

  function normalizar(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function leerFavoritosLugares() {
    try {
      var crudo = localStorage.getItem(CLAVE_FAVORITOS);
      var lista = crudo ? JSON.parse(crudo) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  }

  function guardarFavoritosLugares(lista) {
    try {
      localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(lista));
    } catch (e) {
      /* sin almacenamiento disponible */
    }
  }

  function esFavoritoLugar(id) {
    return leerFavoritosLugares().indexOf(id) >= 0;
  }

  function alternarFavoritoLugar(id) {
    var lista = leerFavoritosLugares();
    var posicion = lista.indexOf(id);
    if (posicion >= 0) {
      lista.splice(posicion, 1);
    } else {
      lista.push(id);
    }
    guardarFavoritosLugares(lista);
  }

  function numeroLlamada(lugar) {
    var bruto = lugar.telefono || lugar.whatsapp || "";
    var digitos = String(bruto).replace(/\D/g, "");
    if (!digitos) return null;
    if (digitos.length === 10) return "+57" + digitos;
    if (digitos.length === 12 && digitos.indexOf("57") === 0) return "+" + digitos;
    return digitos;
  }

  function enlaceMapa(lugar) {
    var consulta =
      lugar.nombre + ", " +
      (lugar.direccion ? lugar.direccion + ", " : "") +
      "Tuluá, Valle del Cauca, Colombia";
    return "https://maps.apple.com/?q=" + encodeURIComponent(consulta);
  }

  function linea(clase, icono, texto) {
    return el("p", clase, icono + " " + texto);
  }

  /* ---------- tarjeta de lugar ---------- */

  function crearTarjeta(lugar, alCambiarFavorito) {
    var tarjeta = el("article", "tur-card");
    var cuerpo = el("div", "tur-body");

    cuerpo.appendChild(el("span", "evento-categoria", lugar.icono + " " + lugar.categoria));
    cuerpo.appendChild(el("h3", "tur-nombre", lugar.nombre));

    if (lugar.descripcion) {
      cuerpo.appendChild(el("p", "tur-desc", lugar.descripcion));
    }
    if (lugar.direccion) {
      cuerpo.appendChild(linea("tur-dato", "📍", lugar.direccion));
    }
    if (lugar.telefono) {
      cuerpo.appendChild(linea("tur-dato", "📞", lugar.telefono));
    }
    if (lugar.whatsapp) {
      cuerpo.appendChild(linea("tur-dato", "💬", "WhatsApp: " + lugar.whatsapp));
    }
    if (lugar.correo) {
      cuerpo.appendChild(linea("tur-dato tur-correo", "✉️", lugar.correo));
    }

    var acciones = el("div", "evento-acciones");

    var botonFavorito = el(
      "button",
      "btn-evento btn-favorito",
      esFavoritoLugar(lugar.id) ? "⭐ Guardado" : "☆ Favorito"
    );
    botonFavorito.type = "button";
    botonFavorito.addEventListener("click", function () {
      alternarFavoritoLugar(lugar.id);
      if (typeof alCambiarFavorito === "function") alCambiarFavorito();
    });
    acciones.appendChild(botonFavorito);

    var mapa = el("a", "btn-evento", "📍 Cómo llegar");
    mapa.href = enlaceMapa(lugar);
    mapa.target = "_blank";
    mapa.rel = "noopener noreferrer";
    acciones.appendChild(mapa);

    var numero = numeroLlamada(lugar);
    if (numero) {
      var llamar = el("a", "btn-evento", "📞 Llamar");
      llamar.href = "tel:" + numero;
      acciones.appendChild(llamar);
    }

    if (lugar.correo) {
      var correo = el("a", "btn-evento", "✉️ Correo");
      correo.href = "mailto:" + lugar.correo;
      acciones.appendChild(correo);
    }

    cuerpo.appendChild(acciones);
    tarjeta.appendChild(cuerpo);
    return tarjeta;
  }

  /* ---------- pantalla de turismo ---------- */

  function categoriasDisponibles() {
    var lista = ["Todos"];
    TURISMO.forEach(function (lugar) {
      if (lista.indexOf(lugar.categoria) < 0) lista.push(lugar.categoria);
    });
    return lista;
  }

  function renderChips() {
    var contenedor = document.getElementById("tur-chips");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    categoriasDisponibles().forEach(function (categoria) {
      var chip = el("button", "chip-filtro" + (estado.categoria === categoria ? " activo" : ""), categoria);
      chip.type = "button";
      chip.addEventListener("click", function () {
        estado.categoria = categoria;
        renderTurismo();
      });
      contenedor.appendChild(chip);
    });
  }

  function filtrarLugares() {
    var favoritos = leerFavoritosLugares();
    var busqueda = normalizar(estado.texto).trim();

    return TURISMO.filter(function (lugar) {
      if (estado.categoria !== "Todos" && lugar.categoria !== estado.categoria) return false;
      if (estado.soloFavoritos && favoritos.indexOf(lugar.id) < 0) return false;
      if (busqueda) {
        var pajar = normalizar(
          lugar.nombre + " " + (lugar.direccion || "") + " " + (lugar.descripcion || "")
        );
        if (pajar.indexOf(busqueda) < 0) return false;
      }
      return true;
    });
  }

  function renderTurismo() {
    var lista = document.getElementById("tur-lista");
    if (!lista) return;

    renderChips();

    var botonFavoritos = document.getElementById("tur-btn-fav");
    if (botonFavoritos) {
      botonFavoritos.classList.toggle("activo", estado.soloFavoritos);
      botonFavoritos.textContent = estado.soloFavoritos ? "⭐ Ver todos" : "⭐ Ver mis favoritos";
    }

    var resultados = filtrarLugares();

    var contador = document.getElementById("tur-contador");
    if (contador) {
      contador.textContent =
        resultados.length === 1 ? "1 lugar" : resultados.length + " lugares";
    }

    lista.innerHTML = "";

    if (resultados.length === 0) {
      lista.appendChild(
        el(
          "p",
          "eventos-vacio",
          estado.soloFavoritos
            ? "Aún no tienes lugares favoritos. Toca ☆ Favorito en un lugar para guardarlo aquí."
            : "No encontramos lugares con ese criterio."
        )
      );
      return;
    }

    resultados.forEach(function (lugar) {
      lista.appendChild(crearTarjeta(lugar, renderTurismo));
    });
  }

  /* ---------- pantalla Mis favoritos ---------- */

  function tarjetaEventoFavorito(evento) {
    var tarjeta = el("article", "tur-card");
    var cuerpo = el("div", "tur-body");

    cuerpo.appendChild(el("span", "evento-categoria", "🎉 " + evento.categoria));
    cuerpo.appendChild(el("h3", "tur-nombre", evento.nombre));
    cuerpo.appendChild(linea("tur-dato", "📅", evento.fecha));
    cuerpo.appendChild(linea("tur-dato", "📍", evento.lugar));

    var acciones = el("div", "evento-acciones");

    var quitar = el("button", "btn-evento btn-favorito", "⭐ Quitar");
    quitar.type = "button";
    quitar.addEventListener("click", function () {
      alternarFavoritoEvento(evento.id);
    });
    acciones.appendChild(quitar);

    if (typeof generarLinkMapa === "function") {
      var mapa = el("a", "btn-evento", "📍 Cómo llegar");
      mapa.href = generarLinkMapa(evento);
      mapa.target = "_blank";
      mapa.rel = "noopener noreferrer";
      acciones.appendChild(mapa);
    }

    cuerpo.appendChild(acciones);
    tarjeta.appendChild(cuerpo);
    return tarjeta;
  }

  function alternarFavoritoEvento(id) {
    /* alternarFavorito (app.js) guarda y vuelve a pintar la lista de eventos */
    if (typeof window.alternarFavorito === "function") {
      window.alternarFavorito(id);
    }
    renderFavoritos();
  }

  function renderFavoritos() {
    var contLugares = document.getElementById("fav-lugares");
    var contEventos = document.getElementById("fav-eventos");
    var vacio = document.getElementById("fav-vacio");
    if (!contLugares || !contEventos) return;

    contLugares.innerHTML = "";
    contEventos.innerHTML = "";

    var idsLugares = leerFavoritosLugares();
    var lugares = TURISMO.filter(function (lugar) {
      return idsLugares.indexOf(lugar.id) >= 0;
    });

    var eventos = [];
    if (typeof EVENTOS !== "undefined" && typeof obtenerFavoritos === "function") {
      var idsEventos = obtenerFavoritos();
      eventos = EVENTOS.filter(function (evento) {
        return idsEventos.indexOf(evento.id) >= 0;
      });
    }

    if (eventos.length) {
      contEventos.appendChild(el("h3", "fav-titulo", "🎉 Eventos"));
      var rejillaEventos = el("div", "tur-lista");
      eventos.forEach(function (evento) {
        rejillaEventos.appendChild(tarjetaEventoFavorito(evento));
      });
      contEventos.appendChild(rejillaEventos);
    }

    if (lugares.length) {
      contLugares.appendChild(el("h3", "fav-titulo", "📍 Lugares para visitar"));
      var rejillaLugares = el("div", "tur-lista");
      lugares.forEach(function (lugar) {
        rejillaLugares.appendChild(crearTarjeta(lugar, renderFavoritos));
      });
      contLugares.appendChild(rejillaLugares);
    }

    if (vacio) vacio.hidden = eventos.length + lugares.length > 0;
  }

  /* ---------- arranque ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    renderTurismo();

    var buscador = document.getElementById("tur-buscar");
    if (buscador) {
      buscador.addEventListener("input", function () {
        estado.texto = buscador.value;
        renderTurismo();
      });
    }

    var botonFavoritos = document.getElementById("tur-btn-fav");
    if (botonFavoritos) {
      botonFavoritos.addEventListener("click", function () {
        estado.soloFavoritos = !estado.soloFavoritos;
        renderTurismo();
      });
    }

    document.querySelectorAll('[data-target="favoritos"]').forEach(function (boton) {
      boton.addEventListener("click", renderFavoritos);
    });

    document.querySelectorAll('[data-target="turismo"]').forEach(function (boton) {
      boton.addEventListener("click", renderTurismo);
    });
  });
})();
