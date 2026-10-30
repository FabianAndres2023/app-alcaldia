/*************************************************
 * TURISMO - DATOS
 * Fuente: https://tulua.gov.co/turismo/
 * Para agregar un lugar, copie un bloque y cambie
 * sus datos. Los campos vacíos usan null.
 *************************************************/

const TURISMO = [
  /* ---------- HOTELES URBANOS ---------- */
  {
    id: "hotel-brisas-del-rio",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Brisas del Río",
    descripcion: "Lugar cómodo para hospedarse, con parqueadero privado gratuito.",
    direccion: "Junto a Casa Huertas",
    telefono: "304 2862154",
    whatsapp: null,
    correo: "hotelbrisasdelrio.tulua@gmail.com"
  },
  {
    id: "hotel-cafe-plaza",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Café Plaza",
    descripcion: "Alojamiento urbano en la zona central de la ciudad.",
    direccion: "Carrera 27 con calle 27, esquina, pisos 4 y 5",
    telefono: "311 3546020",
    whatsapp: null,
    correo: "hotelcafeplazatulua@hotmail.com"
  },
  {
    id: "hotel-calima-real",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Calima Real",
    descripcion: "Ambiente agradable para descansar.",
    direccion: "Cra. 20 # 27-13",
    telefono: "315 2837609",
    whatsapp: null,
    correo: null
  },
  {
    id: "hotel-corona-real",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Corona Real",
    descripcion: "Alojamiento urbano en Tuluá.",
    direccion: "Carrera 40 # 32-03, segundo piso",
    telefono: "315 4861170",
    whatsapp: null,
    correo: "hotelcoronarealtulua@outlook.es"
  },
  {
    id: "hotel-dulces-suenos",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Dulces Sueños Tuluá",
    descripcion: "Alojamiento urbano en el barrio Sajonia, ideal para descansar y para estadías en la ciudad.",
    direccion: "Cr. 24 # 30A-30, barrio Sajonia",
    telefono: null,
    whatsapp: "318 392 6487",
    correo: "hoteldulcessuenostulua@gmail.com"
  },
  {
    id: "hotel-escalinata",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Escalinata",
    descripcion: "Alojamiento urbano en Tuluá.",
    direccion: "Carrera 27A, Avenida Cali",
    telefono: "602 2347962",
    whatsapp: "321 8165436",
    correo: null
  },
  {
    id: "hotel-estacion-tulua",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Estación Tuluá",
    descripcion: "Alojamiento urbano para descansar y para estadías en la ciudad.",
    direccion: null,
    telefono: "314 381 8978",
    whatsapp: "313 722 5907",
    correo: "combuagrosa@hotmail.com"
  },
  {
    id: "hotel-juan-maria",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Juan María",
    descripcion: "Destaca por su comodidad y elegancia.",
    direccion: "Cr. 28 # 27-10",
    telefono: "602 2250623",
    whatsapp: null,
    correo: "reservas@hoteljuanmaria.com"
  },
  {
    id: "hotel-la-mansion-del-sol",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel La Mansión del Sol",
    descripcion: "Destaca por su comodidad y lujo.",
    direccion: "Calle 26 # 22-17",
    telefono: "315 2836512",
    whatsapp: null,
    correo: "hotellamansiondelsol@hotmail.com"
  },
  {
    id: "hotel-lina-maria",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Lina María",
    descripcion: "Destaca por la limpieza de sus habitaciones.",
    direccion: "Calle 27 # 20-39",
    telefono: "315 4300124",
    whatsapp: null,
    correo: "linamariahoteltulua@gmail.com"
  },
  {
    id: "hotel-lion",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Lion",
    descripcion: "Alojamiento tipo apartahotel.",
    direccion: "Calle 29 # 26-52",
    telefono: "317 8141304",
    whatsapp: null,
    correo: "lionhotelero@gmail.com"
  },
  {
    id: "hotel-los-corales",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Los Corales",
    descripcion: "Ofrece un ambiente familiar.",
    direccion: "Cra. 21 # 25-59",
    telefono: "318 3832859",
    whatsapp: null,
    correo: "hoteloscoralestulua@gmail.com"
  },
  {
    id: "hotel-morfeo",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Morfeo",
    descripcion: "Destaca por la limpieza de sus habitaciones.",
    direccion: "Calle 25 # 22-33",
    telefono: "316 046 8150",
    whatsapp: null,
    correo: "info@hotelmorfeotulua.com"
  },
  {
    id: "hotel-principe",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel Príncipe",
    descripcion: "Bien ubicado en la zona comercial de la ciudad.",
    direccion: "Carrera 24 # 26-46",
    telefono: "316 8743799",
    whatsapp: null,
    correo: "info@principeh.com"
  },
  {
    id: "hotel-san-alejo",
    categoria: "Hoteles urbanos",
    icono: "🏨",
    nombre: "Hotel San Alejo",
    descripcion: "Destaca por su comodidad, ubicación y servicio.",
    direccion: "Calle 46 # 25D-49",
    telefono: "304 2364629",
    whatsapp: null,
    correo: "hotelsanalejo@outlook.com"
  },

  /* ---------- FINCAS, HOTELES Y HOSTALES RURALES ---------- */
  {
    id: "eco-hotel-rancho-j",
    categoria: "Rural y glamping",
    icono: "🏕️",
    nombre: "Eco Hotel Rancho J",
    descripcion: "Hospedaje en casa artesanal, con glamping y zona de camping.",
    direccion: "Vía corregimiento El Picacho",
    telefono: "310 6968318",
    whatsapp: null,
    correo: "glampingtulua@gmail.com"
  },
  {
    id: "glamping-ecoparadise",
    categoria: "Rural y glamping",
    icono: "🏕️",
    nombre: "Glamping Ecoparadise",
    descripcion: "Glamping pensado para conectar con la naturaleza.",
    direccion: "La Marina, Valle del Cauca",
    telefono: "318 8475604",
    whatsapp: null,
    correo: "ecoparadise20@gmail.com"
  },
  {
    id: "glamping-sant-sebastian",
    categoria: "Rural y glamping",
    icono: "🏕️",
    nombre: "Glamping Sant Sebastian",
    descripcion: "Glamping en entorno rural.",
    direccion: "La Marina, Valle del Cauca",
    telefono: "318 5846638",
    whatsapp: null,
    correo: null
  },
  {
    id: "hotel-monte-de-venus",
    categoria: "Rural y glamping",
    icono: "🏕️",
    nombre: "Hotel Monte de Venus",
    descripcion: "Alojamiento rural.",
    direccion: null,
    telefono: "314 7755535",
    whatsapp: null,
    correo: null
  },

  /* ---------- APARTAMENTOS Y CASAS TURÍSTICAS ---------- */
  {
    id: "apartaestudios-amoblados",
    categoria: "Apartamentos turísticos",
    icono: "🏠",
    nombre: "Apartaestudios Amoblados",
    descripcion: "Apartamento turístico moderno y totalmente equipado.",
    direccion: "Cra. 37 # 17-45",
    telefono: "317 6207205",
    whatsapp: null,
    correo: "apartaestudios2310@gmail.com"
  },
  {
    id: "apartamento-la-bastilla",
    categoria: "Apartamentos turísticos",
    icono: "🏠",
    nombre: "Apartamento Turístico La Bastilla",
    descripcion: "Apartamento turístico moderno y totalmente equipado.",
    direccion: "Cra. 27D # 40D-03, barrio La Bastilla",
    telefono: "316 5307032",
    whatsapp: null,
    correo: null
  },
  {
    id: "apartamento-victoria",
    categoria: "Apartamentos turísticos",
    icono: "🏠",
    nombre: "Apartamento Turístico Victoria",
    descripcion: "Apartamento turístico moderno y totalmente equipado.",
    direccion: "Cra. 32A # 32-66, barrio Victoria",
    telefono: "316 5307032",
    whatsapp: null,
    correo: null
  }
];
