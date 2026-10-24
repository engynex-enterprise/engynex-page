import type { ProductSignature } from "./types";
import { signature as chatEmpresas } from "./chat-empresas";
import { signature as crmVentas } from "./crm-ventas";
import { signature as mesaAyuda } from "./mesa-ayuda";
import { signature as sistemaPos } from "./sistema-pos";
import { signature as inventarioAlmacen } from "./inventario-almacen";
import { signature as facturacionElectronica } from "./facturacion-electronica";
import { signature as gestionProyectos } from "./gestion-proyectos";
import { signature as gestionDocumental } from "./gestion-documental";
import { signature as intranet } from "./intranet";
import { signature as talentoHumano } from "./talento-humano";
import { signature as sistemaColegios } from "./sistema-colegios";
import { signature as agendaCitas } from "./agenda-citas";

/** Diseño propio de cada producto (null = diseño genérico). */
export const productSignatures: Record<string, ProductSignature | null> = {
  "chat-empresas": chatEmpresas,
  "crm-ventas": crmVentas,
  "mesa-ayuda": mesaAyuda,
  "sistema-pos": sistemaPos,
  "inventario-almacen": inventarioAlmacen,
  "facturacion-electronica": facturacionElectronica,
  "gestion-proyectos": gestionProyectos,
  "gestion-documental": gestionDocumental,
  "intranet": intranet,
  "talento-humano": talentoHumano,
  "sistema-colegios": sistemaColegios,
  "agenda-citas": agendaCitas,
};
