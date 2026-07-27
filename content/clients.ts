/**
 * Empresas que aparecen en la franja de "Empresas que confían en Engynex".
 *
 * IMPORTANTE — antes de publicar:
 * Mostrar la marca de una empresa como cliente implica una relación comercial
 * real. Deja aquí únicamente empresas con las que efectivamente trabajaste y
 * que autorizaron el uso de su marca (idealmente por escrito). Para las demás,
 * cambia el nombre o retíralas de la lista.
 *
 * Cada entrada se dibuja como un logotipo tipográfico (wordmark) generado por
 * el componente `ClientLogos`: NO se reproduce el logo oficial de la marca.
 * Cuando tengas el archivo real, súbelo a `/public/images/clients/` y ponlo en
 * `logo`; el componente lo usará en lugar del wordmark generado.
 */

/** Forma del monograma que acompaña al nombre. */
export type ClientMark = "circle" | "square" | "ring" | "chevron" | "bars";

/** Tratamiento tipográfico del wordmark. */
export type ClientType = "sans" | "wide" | "tight" | "display";

export interface Client {
  /** Nombre visible. */
  name: string;
  /** Iniciales del monograma (1–2 caracteres). */
  initials: string;
  mark: ClientMark;
  type: ClientType;
  /** Archivo real del logo, si existe (ej. "/images/clients/exito.svg"). */
  logo?: string;
  /** Marca reconocida: se muestra en el grid destacado. */
  featured?: boolean;
  es: { sector: string };
  en: { sector: string };
}

export const clients: Client[] = [
  // ---- Marcas reconocidas ----
  {
    name: "Éxito",
    initials: "É",
    mark: "square",
    type: "display",
    featured: true,
    es: { sector: "Retail" },
    en: { sector: "Retail" },
  },
  {
    name: "Falabella",
    initials: "F",
    mark: "circle",
    type: "wide",
    featured: true,
    es: { sector: "Retail & moda" },
    en: { sector: "Retail & fashion" },
  },
  {
    name: "Alkosto",
    initials: "A",
    mark: "chevron",
    type: "tight",
    featured: true,
    es: { sector: "Retail tecnología" },
    en: { sector: "Tech retail" },
  },
  {
    name: "Homecenter",
    initials: "H",
    mark: "square",
    type: "sans",
    featured: true,
    es: { sector: "Mejoramiento del hogar" },
    en: { sector: "Home improvement" },
  },
  {
    name: "Colsubsidio",
    initials: "C",
    mark: "ring",
    type: "sans",
    featured: true,
    es: { sector: "Caja de compensación" },
    en: { sector: "Welfare fund" },
  },
  {
    name: "Postobón",
    initials: "P",
    mark: "circle",
    type: "display",
    featured: true,
    es: { sector: "Bebidas" },
    en: { sector: "Beverages" },
  },
  {
    name: "Alpina",
    initials: "A",
    mark: "chevron",
    type: "wide",
    featured: true,
    es: { sector: "Alimentos" },
    en: { sector: "Food" },
  },
  {
    name: "Cine Colombia",
    initials: "CC",
    mark: "bars",
    type: "tight",
    featured: true,
    es: { sector: "Entretenimiento" },
    en: { sector: "Entertainment" },
  },
  {
    name: "Juan Valdez",
    initials: "JV",
    mark: "circle",
    type: "display",
    featured: true,
    es: { sector: "Café & retail" },
    en: { sector: "Coffee & retail" },
  },
  {
    name: "Terpel",
    initials: "T",
    mark: "chevron",
    type: "wide",
    featured: true,
    es: { sector: "Energía" },
    en: { sector: "Energy" },
  },

  // ---- Empresas medianas y locales ----
  {
    name: "Distribuciones Andina",
    initials: "DA",
    mark: "bars",
    type: "sans",
    es: { sector: "Distribución mayorista" },
    en: { sector: "Wholesale distribution" },
  },
  {
    name: "Clínica Santa Mónica",
    initials: "SM",
    mark: "ring",
    type: "sans",
    es: { sector: "Salud" },
    en: { sector: "Healthcare" },
  },
  {
    name: "Transportes Ruta Norte",
    initials: "RN",
    mark: "chevron",
    type: "tight",
    es: { sector: "Logística" },
    en: { sector: "Logistics" },
  },
  {
    name: "Colegio San Marcos",
    initials: "SM",
    mark: "square",
    type: "display",
    es: { sector: "Educación" },
    en: { sector: "Education" },
  },
  {
    name: "Autopartes Vélez",
    initials: "AV",
    mark: "circle",
    type: "tight",
    es: { sector: "Automotriz" },
    en: { sector: "Automotive" },
  },
  {
    name: "AgroValle",
    initials: "AV",
    mark: "chevron",
    type: "wide",
    es: { sector: "Agroindustria" },
    en: { sector: "Agribusiness" },
  },
  {
    name: "Textiles Medellín",
    initials: "TM",
    mark: "bars",
    type: "sans",
    es: { sector: "Manufactura" },
    en: { sector: "Manufacturing" },
  },
  {
    name: "Inmobiliaria Cardona",
    initials: "IC",
    mark: "ring",
    type: "display",
    es: { sector: "Inmobiliario" },
    en: { sector: "Real estate" },
  },
  {
    name: "Ferretería El Roble",
    initials: "ER",
    mark: "square",
    type: "tight",
    es: { sector: "Ferretería" },
    en: { sector: "Hardware" },
  },
  {
    name: "Hotel Casa Bolívar",
    initials: "CB",
    mark: "circle",
    type: "display",
    es: { sector: "Hotelería" },
    en: { sector: "Hospitality" },
  },
];

/** Marcas reconocidas, para el grid destacado. */
export const featuredClients = clients.filter((client) => client.featured);
