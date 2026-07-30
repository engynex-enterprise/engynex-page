/**
 * Tecnologías con las que trabajamos.
 *
 * `mark` apunta a una de las marcas SVG dibujadas en `components/TechLogo.tsx`.
 * Si prefieres el logotipo oficial, deja el archivo en `/public/images/tech/`
 * y ponlo en `logo`: tiene prioridad sobre el dibujo.
 */
export interface Tech {
  name: string;
  /** Clave de la marca SVG interna. */
  mark?: string;
  /** Ruta a un logo real, si lo tienes. */
  logo?: string;
  /** Color del monograma de reserva. */
  color?: string;
  /** Capa a la que pertenece; se muestra como etiqueta de fila. */
  group: "product" | "backend" | "cloud" | "commerce";
}

/** Orden de las capas en la tabla. */
export const techGroups = [
  "product",
  "backend",
  "cloud",
  "commerce",
] as const;

export const technologies: Tech[] = [
  { name: "Next.js", mark: "nextjs", group: "product" },
  { name: "React", mark: "react", group: "product" },
  { name: "TypeScript", mark: "typescript", group: "product" },
  { name: "Tailwind CSS", mark: "tailwind", group: "product" },
  { name: "Node.js", mark: "nodejs", group: "backend" },
  { name: "PostgreSQL", mark: "postgres", group: "backend" },
  { name: "Docker", mark: "docker", group: "cloud" },
  { name: "AWS", mark: "aws", group: "cloud" },
  { name: "Vercel", mark: "vercel", group: "cloud" },
  { name: "Flutter", mark: "flutter", group: "commerce" },
  { name: "React Native", mark: "react", group: "commerce" },
  { name: "Figma", mark: "figma", group: "product" },
  { name: "OpenAI", mark: "openai", group: "backend" },
  { name: "Shopify", mark: "shopify", group: "commerce" },
  { name: "WordPress", mark: "wordpress", group: "commerce" },
  { name: "Wompi", color: "#4C2DA0", group: "commerce" },
];
