import type { Locale } from "@/i18n/config";
import type { ShowcaseCopy } from "./types";
import { desarrolloWebPage } from "./desarrollo-web";
import { plataformasWebPage } from "./plataformas-web";

/** Servicios con página insignia propia (los demás usan la plantilla general). */
export const showcasePages: Record<string, Record<Locale, ShowcaseCopy>> = {
  "desarrollo-web": desarrolloWebPage,
  "plataformas-web": plataformasWebPage,
};

export type { ShowcaseCopy } from "./types";
