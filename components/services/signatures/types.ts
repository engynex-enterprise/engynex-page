import type { Service } from "@/content/services";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/** Datos que recibe la cabecera y la sección insignia de cada servicio. */
export interface SignatureProps {
  service: Service;
  locale: Locale;
  dict: Dictionary;
}

export interface SignatureHeroProps extends SignatureProps {
  backLabel: string;
  backHref: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string; external?: boolean };
}

export type Tone = "light" | "muted";

/**
 * Diseño propio de un servicio.
 *
 * - `Hero` reemplaza la cabecera fotográfica genérica. Debe usar
 *   `HeroBreadcrumb` y `HeroActions` (./shared) para que el regreso y los
 *   botones sean iguales en todo el sitio.
 * - `Showcase` es la sección insignia: se inserta justo después de la visión
 *   general y recibe el tono (blanco/gris) que le toca en la alternancia.
 */
export interface ServiceSignature {
  Hero: (props: SignatureHeroProps) => React.ReactNode;
  Showcase?: (props: SignatureProps & { tone: Tone }) => React.ReactNode;
  /**
   * Secciones genéricas que el diseño propio ya cubre y que se omiten, para
   * no repetir contenido (p. ej. `"extra"`: compromisos de servicio, stack o
   * casos de uso de la familia).
   */
  replaces?: "extra"[];
}
