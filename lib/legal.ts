import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/lib/site";

/**
 * Identidad legal de Engynex usada por los documentos de /legal.
 *
 * IMPORTANTE: los campos en `null` son datos que aún no conocemos y NO deben
 * inventarse. Mientras estén en `null`, los textos se redactan sin ellos
 * (p. ej. «Engynex (en adelante, «Engynex»)» y el contacto por
 * contacto@engynex.com). En cuanto se completen aquí, aparecen solos en todos
 * los documentos, en español y en inglés.
 */
export const legalIdentity: {
  /** Nombre comercial. */
  brand: string;
  /** Razón social tal como figura en el RUT / Cámara de Comercio. PENDIENTE. */
  razonSocial: string | null;
  /** NIT con dígito de verificación, p. ej. "900.000.000-0". PENDIENTE. */
  nit: string | null;
  /** Domicilio: dirección física y ciudad, p. ej. "Calle 00 # 00-00, Bogotá D.C.". PENDIENTE. */
  domicilio: string | null;
  /** Nombre del representante legal. PENDIENTE. */
  representanteLegal: string | null;
  /**
   * Correo exclusivo para consultas y reclamos sobre datos personales
   * (p. ej. "datos@engynex.com"). PENDIENTE: mientras sea `null` se usa el
   * correo general.
   */
  privacyEmail: string | null;
  email: string;
  phone: string;
  website: string;
  domain: string;
} = {
  brand: siteConfig.name,
  razonSocial: null,
  nit: null,
  domicilio: null,
  representanteLegal: null,
  privacyEmail: null,
  email: siteConfig.email,
  phone: siteConfig.phone,
  website: siteConfig.url,
  domain: siteConfig.domain,
};

/** Fecha de la última actualización de los documentos legales (ISO). */
export const lastUpdated = "2026-10-24";

/** «24 de octubre de 2026» / «October 24, 2026». */
export function formatLegalDate(locale: Locale, iso: string = lastUpdated): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(
    locale === "es" ? "es-CO" : "en-US",
    { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  );
}

/** Correo para ejercer derechos sobre datos personales. */
export function privacyContactEmail(): string {
  return legalIdentity.privacyEmail ?? legalIdentity.email;
}

/**
 * Designación completa de la empresa para el encabezado de cada documento.
 * Incluye razón social, NIT y domicilio solo cuando están definidos.
 */
export function legalEntityDesignation(locale: Locale): string {
  const { brand, razonSocial, nit, domicilio } = legalIdentity;
  const es = locale === "es";
  const parts: string[] = [];
  parts.push(razonSocial ?? brand);
  if (nit) parts.push(es ? `identificada con NIT ${nit}` : `holding tax ID (NIT) ${nit}`);
  if (domicilio) parts.push(es ? `con domicilio en ${domicilio}` : `domiciled at ${domicilio}`);
  let text = parts.join(", ");
  if (razonSocial) text += es ? `, que opera bajo la marca ${brand}` : `, operating under the ${brand} brand`;
  return `${text} ${es ? "(en adelante, «Engynex»)" : "(hereinafter, “Engynex”)"}`;
}

/**
 * Filas de identificación del responsable (solo las conocidas), para la
 * política de datos y el aviso de privacidad.
 */
export function legalIdentityRows(locale: Locale): string[] {
  const es = locale === "es";
  const { brand, razonSocial, nit, domicilio, representanteLegal, website, phone } =
    legalIdentity;
  const rows: (string | null)[] = [
    es
      ? `${razonSocial ? "Razón social" : "Nombre"}: ${razonSocial ?? brand}`
      : `${razonSocial ? "Legal name" : "Name"}: ${razonSocial ?? brand}`,
    razonSocial ? (es ? `Marca comercial: ${brand}` : `Trade name: ${brand}`) : null,
    nit ? `NIT: ${nit}` : null,
    domicilio ? (es ? `Domicilio: ${domicilio}` : `Address: ${domicilio}`) : null,
    representanteLegal
      ? es
        ? `Representante legal: ${representanteLegal}`
        : `Legal representative: ${representanteLegal}`
      : null,
    es
      ? `Correo electrónico: ${privacyContactEmail()}`
      : `Email: ${privacyContactEmail()}`,
    es ? `Teléfono y WhatsApp: ${phone}` : `Phone and WhatsApp: ${phone}`,
    es ? `Sitio web: ${website}` : `Website: ${website}`,
  ];
  return rows.filter((row): row is string => row !== null);
}
