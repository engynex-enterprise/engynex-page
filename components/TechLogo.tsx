import Image from "next/image";
import type { Tech } from "@/content/tech";
import { cn } from "@/lib/utils";

/**
 * Marcas de las tecnologías con las que trabajamos.
 *
 * Son versiones simplificadas dibujadas a mano en SVG, no los archivos
 * oficiales de cada marca: se usan a modo de referencia técnica. Si quieres el
 * logotipo exacto, deja el SVG en `/public/images/tech/` y ponlo en el campo
 * `logo` de `content/tech.ts`; este componente lo usará en su lugar.
 */

type MarkProps = { className?: string };

const marks: Record<string, (props: MarkProps) => React.ReactElement> = {
  nextjs: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="11" className="fill-heading" />
      <path
        d="M9 16.5v-9l7 9M15.2 7.5v6"
        className="stroke-surface"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  react: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="2.05" fill="#61DAFB" />
      <g fill="none" stroke="#61DAFB" strokeWidth="1.1">
        <ellipse cx="12" cy="12" rx="10.5" ry="4" />
        <ellipse
          cx="12"
          cy="12"
          rx="10.5"
          ry="4"
          transform="rotate(60 12 12)"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="10.5"
          ry="4"
          transform="rotate(120 12 12)"
        />
      </g>
    </svg>
  ),
  typescript: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="3" fill="#3178C6" />
      <text
        x="12"
        y="16.8"
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        fill="#fff"
        fontFamily="var(--font-sans)"
      >
        TS
      </text>
    </svg>
  ),
  nodejs: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 1 21.5 6.5v11L12 23 2.5 17.5v-11z" fill="#539E43" />
      <path
        d="M12 4.4 18.6 8.2v7.6L12 19.6 5.4 15.8V8.2z"
        fill="#fff"
        opacity="0.16"
      />
      <text
        x="12"
        y="15.6"
        textAnchor="middle"
        fontSize="7"
        fontWeight="800"
        fill="#fff"
        fontFamily="var(--font-sans)"
      >
        JS
      </text>
    </svg>
  ),
  tailwind: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#38BDF8"
        d="M12 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.31.74 1.91 1.35.98 1 2.09 2.15 4.59 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35C15.61 7.15 14.5 6 12 6ZM7 12c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.91 1.35C8.39 16.85 9.5 18 12 18c2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35C10.61 13.15 9.5 12 7 12Z"
      />
    </svg>
  ),
  flutter: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M14.6 1.4 3.6 12.4l3.4 3.4L21.4 1.4z" fill="#47C5FB" />
      <path d="M14.5 12.5 21.4 5.6h-6.8L11 9.1z" fill="#47C5FB" />
      <path d="M7 15.8l3.4-3.4 3.4 3.4-3.4 3.4z" fill="#00569E" />
      <path d="M10.4 19.2 14.6 23h6.8l-7.5-7.2z" fill="#00B5F8" />
    </svg>
  ),
  figma: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M8.5 1.5h3.5v5H8.5a2.5 2.5 0 0 1 0-5Z"
        fill="#F24E1E"
      />
      <path d="M12 1.5h3.5a2.5 2.5 0 0 1 0 5H12v-5Z" fill="#FF7262" />
      <path d="M8.5 6.5H12v5H8.5a2.5 2.5 0 0 1 0-5Z" fill="#A259FF" />
      <circle cx="15" cy="12" r="3" fill="#1ABCFE" />
      <path
        d="M8.5 11.5H12v2.5a2.5 2.5 0 1 1-3.5-2.5Z"
        fill="#0ACF83"
      />
    </svg>
  ),
  docker: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <g fill="#2496ED">
        <rect x="5" y="10" width="2.6" height="2.6" rx="0.3" />
        <rect x="8.1" y="10" width="2.6" height="2.6" rx="0.3" />
        <rect x="11.2" y="10" width="2.6" height="2.6" rx="0.3" />
        <rect x="8.1" y="7" width="2.6" height="2.6" rx="0.3" />
        <rect x="11.2" y="7" width="2.6" height="2.6" rx="0.3" />
        <rect x="14.3" y="10" width="2.6" height="2.6" rx="0.3" />
      </g>
      <path
        d="M22 12.2c-.8-.5-2.1-.6-3-.3-.2-1-.8-1.9-1.7-2.5l-.5-.3-.3.5c-.5.8-.6 2-.1 2.9-.6.3-1.3.4-2 .4H2.2c-.3 1.6.1 3.7 1.4 5.2 1.3 1.4 3.2 2.1 5.7 2.1 5.4 0 9.4-2.5 11.3-7 .8 0 1.7-.2 2.2-.9l.2-.3-.9-.5Z"
        fill="#2496ED"
      />
    </svg>
  ),
  // viewBox cuadrado: el contenedor de la marca es 28×28 y un lienzo apaisado
  // se aplastaba.
  aws: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <text
        x="12"
        y="13"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="800"
        className="fill-heading"
        fontFamily="var(--font-sans)"
      >
        aws
      </text>
      <path
        d="M3.5 18c3.4 2.2 13.6 2.2 17 0"
        stroke="#FF9900"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M19 16.3 22 18.2l-3.2 1.6z" fill="#FF9900" />
    </svg>
  ),
  postgres: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="12" fill="#336791" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="800"
        fill="#fff"
        fontFamily="var(--font-sans)"
      >
        Pg
      </text>
    </svg>
  ),
  shopify: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M15.6 4.2c-.1-.1-.3-.1-.4-.1l-1 .2c-.3-.9-.9-1.8-1.9-1.8h-.2c-.3-.4-.7-.6-1.1-.6-2 0-3 2.5-3.3 3.8l-1.4.4c-.4.1-.5.2-.5.6L4.4 20.6 15 22.5l4.6-1L15.6 4.2Zm-3.2.4-1.7.5c.2-1 .7-2 1.4-2.3.2.4.3 1 .3 1.8Zm-1.6-2.3c.1 0 .2 0 .3.1-.8.6-1.4 1.8-1.6 3.1l-1.4.4c.4-1.4 1.3-3.6 2.7-3.6Zm.5 8.7c-.3-.2-.9-.4-1.5-.4-1.3 0-1.3.8-1.3 1 0 1.1 2.9 1.5 2.9 4.1 0 2-1.3 3.3-3 3.3-2.1 0-3.1-1.3-3.1-1.3l.6-1.9s1.1.9 2 .9c.6 0 .8-.5.8-.8 0-1.4-2.4-1.5-2.4-3.9 0-2 1.4-3.9 4.3-3.9 1.1 0 1.7.3 1.7.3l-.8 2.5Zm1.5-6.6c0-.7-.1-1.4-.3-1.9.6.1 1 .8 1.2 1.7l-.9.2Z"
        fill="#95BF47"
      />
    </svg>
  ),
  wordpress: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#21759B" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        fill="#fff"
        fontFamily="var(--font-sans)"
      >
        W
      </text>
    </svg>
  ),
  vercel: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 3 22.5 21H1.5z" className="fill-heading" />
    </svg>
  ),
  openai: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="10.5"
        className="fill-none stroke-heading"
        strokeWidth="1.4"
      />
      <path
        d="M12 5.6 17.5 8.8v6.4L12 18.4 6.5 15.2V8.8z"
        className="fill-none stroke-heading"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M12 12v6.4M12 12 6.5 8.8M12 12l5.5-3.2"
        className="stroke-heading"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
};

/** Monograma de reserva cuando la tecnología no tiene marca dibujada. */
function Monogram({ tech }: { tech: Tech }) {
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-lg text-[0.6rem] font-black text-white"
      style={{ backgroundColor: tech.color ?? "var(--heading)" }}
      aria-hidden
    >
      {tech.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function TechLogo({
  tech,
  className,
}: {
  tech: Tech;
  className?: string;
}) {
  if (tech.logo) {
    return (
      <Image
        src={tech.logo}
        alt={tech.name}
        width={28}
        height={28}
        className={cn("h-7 w-auto object-contain", className)}
      />
    );
  }

  const Mark = tech.mark ? marks[tech.mark] : undefined;
  if (!Mark) return <Monogram tech={tech} />;

  return <Mark className={cn("h-7 w-7", className)} />;
}
