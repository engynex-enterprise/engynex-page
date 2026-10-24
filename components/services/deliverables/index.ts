import type { DeliverablesDesign } from "./types";
import { deliverables as desarrolloWeb } from "./desarrollo-web";
import { deliverables as plataformasWeb } from "./plataformas-web";
import { deliverables as appsMoviles } from "./apps-moviles";
import { deliverables as ecommerce } from "./ecommerce";
import { deliverables as uxUiBranding } from "./ux-ui-branding";
import { deliverables as marketingDigital } from "./marketing-digital";
import { deliverables as produccionAudiovisual } from "./produccion-audiovisual";
import { deliverables as iaAutomatizacion } from "./ia-automatizacion";
import { deliverables as cloudDevops } from "./cloud-devops";
import { deliverables as ciberseguridad } from "./ciberseguridad";
import { deliverables as hostingMantenimiento } from "./hosting-mantenimiento";
import { deliverables as consultoriaTech } from "./consultoria-tech";
import { deliverables as dataAnalytics } from "./data-analytics";
import { deliverables as integracionesApis } from "./integraciones-apis";
import { deliverables as soporteTi } from "./soporte-ti";
import { deliverables as alquilerEquipos } from "./alquiler-equipos";

/** "Qué recibes" propio de cada servicio (null = lista genérica). */
export const deliverablesDesigns: Record<string, DeliverablesDesign | null> = {
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
