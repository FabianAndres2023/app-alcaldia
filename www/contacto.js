/*************************************************
 * ATENCIÓN AL CIUDADANO - CONTACTO
 *************************************************/

const CONTACTO = {
  entidad: "Alcaldía de Tuluá",
  direccion: "Carrera 25 # 25-04",
  ciudad: "Tuluá, Valle del Cauca",
  codigoPostal: "763022",
  telefono: "+576022339300",
  telefonoTexto: "+57 (602) 233 9300",
  correo: "servicioalciudadano@tulua.gov.co",
  horarioNota: "Línea de anticorrupción y atención al ciudadano"
};

function contactoLinkMapa() {
  const q = encodeURIComponent(
    CONTACTO.entidad + ", " + CONTACTO.direccion + ", " + CONTACTO.ciudad + ", Colombia"
  );
  return "https://maps.apple.com/?q=" + q;
}

function contactoTextoDireccion() {
  return (
    CONTACTO.entidad + "\n" +
    CONTACTO.direccion + "\n" +
    CONTACTO.ciudad + "\n" +
    "Código postal " + CONTACTO.codigoPostal
  );
}

async function contactoCopiar(texto, boton) {
  const original = boton.textContent;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texto);
    } else {
      const area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    boton.textContent = "✅ Copiado";
  } catch (e) {
    boton.textContent = "No se pudo copiar";
  }
  setTimeout(function () {
    boton.textContent = original;
  }, 2000);
}

async function contactoCompartir(boton) {
  const datos = {
    title: CONTACTO.entidad,
    text: contactoTextoDireccion() + "\nTeléfono: " + CONTACTO.telefonoTexto
  };

  if (navigator.share) {
    try {
      await navigator.share(datos);
    } catch (e) {
      /* el usuario canceló */
    }
  } else {
    contactoCopiar(datos.text, boton);
  }
}

function renderContacto() {
  const contenedor = document.getElementById("contacto-lista");
  if (!contenedor) return;

  contenedor.innerHTML =
    '<article class="contacto-card">' +
      '<h3 class="contacto-titulo">Sede principal</h3>' +
      '<p class="contacto-linea">📍 ' + CONTACTO.direccion + '</p>' +
      '<p class="contacto-linea">' + CONTACTO.ciudad + ' · C.P. ' + CONTACTO.codigoPostal + '</p>' +
      '<div class="contacto-acciones">' +
        '<a class="btn-contacto" href="' + contactoLinkMapa() + '">🗺️ Cómo llegar</a>' +
        '<button type="button" class="btn-contacto" id="btn-copiar-direccion">📋 Copiar dirección</button>' +
      '</div>' +
    '</article>' +

    '<article class="contacto-card">' +
      '<h3 class="contacto-titulo">Línea de atención</h3>' +
      '<p class="contacto-linea">📞 ' + CONTACTO.telefonoTexto + '</p>' +
      '<p class="contacto-nota">' + CONTACTO.horarioNota + '</p>' +
      '<div class="contacto-acciones">' +
        '<a class="btn-contacto" href="tel:' + CONTACTO.telefono + '">📞 Llamar</a>' +
      '</div>' +
    '</article>' +

    '<article class="contacto-card">' +
      '<h3 class="contacto-titulo">Correo institucional</h3>' +
      '<p class="contacto-linea">✉️ ' + CONTACTO.correo + '</p>' +
      '<div class="contacto-acciones">' +
        '<a class="btn-contacto" href="mailto:' + CONTACTO.correo + '?subject=Consulta%20Alcald%C3%ADa%20de%20Tulu%C3%A1">✉️ Escribir correo</a>' +
        '<button type="button" class="btn-contacto" id="btn-compartir-contacto">📤 Compartir datos</button>' +
      '</div>' +
    '</article>';

  const btnCopiar = document.getElementById("btn-copiar-direccion");
  if (btnCopiar) {
    btnCopiar.addEventListener("click", function () {
      contactoCopiar(contactoTextoDireccion(), btnCopiar);
    });
  }

  const btnCompartir = document.getElementById("btn-compartir-contacto");
  if (btnCompartir) {
    btnCompartir.addEventListener("click", function () {
      contactoCompartir(btnCompartir);
    });
  }
}

document.addEventListener("DOMContentLoaded", renderContacto);
