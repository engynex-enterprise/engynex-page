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
  /** Agrupación mostrada como etiqueta. */
  group: "frontend" | "backend" | "mobile" | "cloud" | "design" | "commerce";
}

export const technologies: Tech[] = [
  { name: "Next.js", mark: "nextjs", group: "frontend" },
  { name: "React", mark: "react", group: "frontend" },
  { name: "TypeScript", mark: "typescript", group: "frontend" },
  { name: "Tailwind CSS", mark: "tailwind", group: "frontend" },
  { name: "Node.js", mark: "nodejs", group: "backend" },
  { name: "PostgreSQL", mark: "postgres", group: "backend" },
  { name: "Docker", mark: "docker", group: "cloud" },
  { name: "AWS", mark: "aws", group: "cloud" },
  { name: "Vercel", mark: "vercel", group: "cloud" },
  { name: "Flutter", mark: "flutter", group: "mobile" },
  { name: "React Native", mark: "react", group: "mobile" },
  { name: "Figma", mark: "figma", group: "design" },
  { name: "OpenAI", mark: "openai", group: "backend" },
  { name: "Shopify", mark: "shopify", group: "commerce" },
  { name: "WordPress", mark: "wordpress", group: "commerce" },
  { name: "Wompi", color: "#4C2DA0", group: "commerce" },
];
