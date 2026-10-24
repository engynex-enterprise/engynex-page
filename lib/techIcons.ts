import {
  siAppstore,
  siDocker,
  siFirebase,
  siFlutter,
  siGithubactions,
  siGoogleanalytics,
  siGoogleplay,
  siGooglesearchconsole,
  siGraphql,
  siKotlin,
  siMake,
  siMercadopago,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siRabbitmq,
  siReact,
  siRedis,
  siShopify,
  siSwift,
  siTailwindcss,
  siTypescript,
  siVercel,
  siWoocommerce,
  siWordpress,
  siZapier,
  type SimpleIcon,
} from "simple-icons";

/**
 * Logos de tecnologías (SVG de simple-icons, licencia CC0).
 *
 * Las que no tienen logo libre (AWS, Wompi, PayU, Siigo, Coordinadora,
 * TestFlight) se muestran como monograma, y los conceptos genéricos (REST,
 * Webhooks, OAuth) con un icono de lucide: nunca se dibuja un logo inventado.
 */
const brandIcons: Record<string, SimpleIcon> = {
  "Next.js": siNextdotjs,
  React: siReact,
  "React Native": siReact,
  TypeScript: siTypescript,
  "Tailwind CSS": siTailwindcss,
  WordPress: siWordpress,
  Vercel: siVercel,
  "Google Analytics": siGoogleanalytics,
  "Search Console": siGooglesearchconsole,
  "Node.js": siNodedotjs,
  PostgreSQL: siPostgresql,
  Redis: siRedis,
  Docker: siDocker,
  "GitHub Actions": siGithubactions,
  Flutter: siFlutter,
  Swift: siSwift,
  Kotlin: siKotlin,
  Firebase: siFirebase,
  "App Store": siAppstore,
  "Google Play": siGoogleplay,
  Shopify: siShopify,
  WooCommerce: siWoocommerce,
  "Mercado Pago": siMercadopago,
  GraphQL: siGraphql,
  RabbitMQ: siRabbitmq,
  Zapier: siZapier,
  Make: siMake,
};

/** Conceptos sin marca: se pintan con un icono genérico de lucide. */
export const genericTech: Record<string, "braces" | "webhook" | "key"> = {
  REST: "braces",
  Webhooks: "webhook",
  "OAuth 2.0": "key",
};

export type TechIcon =
  | { kind: "brand"; path: string; hex: string }
  | { kind: "generic"; icon: "braces" | "webhook" | "key" }
  | { kind: "monogram"; text: string };

export function techIcon(name: string): TechIcon {
  const brand = brandIcons[name];
  if (brand) return { kind: "brand", path: brand.path, hex: `#${brand.hex}` };
  const generic = genericTech[name];
  if (generic) return { kind: "generic", icon: generic };
  // Monograma: iniciales de las palabras (máx. 2) o las dos primeras letras.
  const words = name.split(/\s+/).filter(Boolean);
  const text =
    words.length > 1
      ? words.slice(0, 2).map((w) => w[0]).join("")
      : name.slice(0, 2);
  return { kind: "monogram", text: text.toUpperCase() };
}
