import type { Product } from "@/content/products";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export interface ProductSignatureProps {
  product: Product;
  locale: Locale;
  dict: Dictionary;
}

export interface ProductHeroProps extends ProductSignatureProps {
  backLabel: string;
  backHref: string;
  /** Nombre de la categoría, si el producto tiene. */
  categoryLabel?: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string; external?: boolean };
}

export type Tone = "light" | "muted";

/**
 * Diseño propio de un producto.
 *
 * - `Hero` reemplaza la cabecera fotográfica genérica; debe usar
 *   `HeroBreadcrumb` y `HeroActions` de components/services/signatures/shared
 *   para que el regreso y los botones sean iguales en todo el sitio.
 * - `Showcase` es la sección insignia (la "demo" del producto); va justo
 *   después de "En qué consiste" y reemplaza la maqueta genérica de "Qué
 *   incluye".
 */
export interface ProductSignature {
  Hero: (props: ProductHeroProps) => React.ReactNode;
  Showcase?: (props: ProductSignatureProps & { tone: Tone }) => React.ReactNode;
}
