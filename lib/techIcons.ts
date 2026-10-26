import {
  siAppstore,
  siDocker,
  siFastlane,
  siFirebase,
  siFlutter,
  siGithubactions,
  siGoogleanalytics,
  siGoogleplay,
  siGooglesearchconsole,
  siGraphql,
  siJetpackcompose,
  siKotlin,
  siMake,
  siMedusa,
  siMercadopago,
  siN8n,
  siNextdotjs,
  siNodedotjs,
  siOpenapiinitiative,
  siPostgresql,
  siPostman,
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
 * Las que no están en simple-icons (AWS, Wompi, PayU, Siigo, TestFlight…)
 * usan su logo oficial guardado en /public, y los conceptos genéricos (REST,
 * Webhooks, OAuth) un icono de lucide: nunca se dibuja un logo inventado.
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
  Fastlane: siFastlane,
  "Jetpack Compose": siJetpackcompose,
  Medusa: siMedusa,
  OpenAPI: siOpenapiinitiative,
  Postman: siPostman,
  n8n: siN8n,
};

/**
 * Marcas sin SVG libre en simple-icons: su logo oficial descargado de su
 * sitio (o de Wikimedia Commons) y servido desde /public.
 */
const imageIcons: Record<string, string> = {
  AWS: "/images/integrations/aws.svg",
  TestFlight: "/images/integrations/testflight.png",
  SwiftUI: "/images/integrations/swiftui.png",
  "Google Merchant Center": "/images/integrations/merchantcenter.svg",
  Wompi: "/images/integrations/wompi.png",
  PayU: "/images/integrations/payu.png",
  Siigo: "/images/integrations/siigo.png",
  Alegra: "/images/integrations/alegra.svg",
  Coordinadora: "/images/integrations/coordinadora.png",
  Servientrega: "/images/integrations/servientrega.png",
};

/** Conceptos sin marca: se pintan con un icono genérico de lucide. */
export const genericTech: Record<string, "braces" | "webhook" | "key"> = {
  REST: "braces",
  Webhooks: "webhook",
  "OAuth 2.0": "key",
};

export type TechIcon =
  | { kind: "brand"; path: string; hex: string }
  | { kind: "image"; src: string }
  | { kind: "generic"; icon: "braces" | "webhook" | "key" }
  | { kind: "monogram"; text: string };

export function techIcon(name: string): TechIcon {
  const brand = brandIcons[name];
  if (brand) return { kind: "brand", path: brand.path, hex: `#${brand.hex}` };
  const image = imageIcons[name];
  if (image) return { kind: "image", src: image };
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
