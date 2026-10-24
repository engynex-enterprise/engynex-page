import type { ServiceSignature } from "./types";
import { signature as desarrolloWeb } from "./desarrollo-web";
import { signature as plataformasWeb } from "./plataformas-web";
import { signature as appsMoviles } from "./apps-moviles";
import { signature as ecommerce } from "./ecommerce";
import { signature as uxUiBranding } from "./ux-ui-branding";
import { signature as marketingDigital } from "./marketing-digital";
import { signature as produccionAudiovisual } from "./produccion-audiovisual";
import { signature as iaAutomatizacion } from "./ia-automatizacion";
import { signature as cloudDevops } from "./cloud-devops";
import { signature as ciberseguridad } from "./ciberseguridad";
import { signature as hostingMantenimiento } from "./hosting-mantenimiento";
import { signature as consultoriaTech } from "./consultoria-tech";
import { signature as dataAnalytics } from "./data-analytics";
import { signature as integracionesApis } from "./integraciones-apis";
import { signature as soporteTi } from "./soporte-ti";
import { signature as alquilerEquipos } from "./alquiler-equipos";

/** Diseño propio de cada servicio (cabecera + sección insignia). */
export const signatures: Record<string, ServiceSignature> = {
  "desarrollo-web": desarrolloWeb,
  "plataformas-web": plataformasWeb,
  "apps-moviles": appsMoviles,
  "ecommerce": ecommerce,
  "ux-ui-branding": uxUiBranding,
  "marketing-digital": marketingDigital,
  "produccion-audiovisual": produccionAudiovisual,
  "ia-automatizacion": iaAutomatizacion,
  "cloud-devops": cloudDevops,
  "ciberseguridad": ciberseguridad,
  "hosting-mantenimiento": hostingMantenimiento,
  "consultoria-tech": consultoriaTech,
  "data-analytics": dataAnalytics,
  "integraciones-apis": integracionesApis,
  "soporte-ti": soporteTi,
  "alquiler-equipos": alquilerEquipos,
};
