import Image from "next/image";
import { ParallaxLayer } from "@/components/ui/Parallax";
import { cn } from "@/lib/utils";

/**
 * Capa decorativa de sección: fotografía de fondo con parallax, halos de color
 * difuminados y malla de puntos.
 *
 * Va dentro de una sección con `position: relative` y siempre por detrás del
 * contenido (`-z-10`), así que nunca intercepta clics.
 *
 * La fotografía se mantiene en una opacidad muy baja y además lleva una máscara
 * radial que la desvanece en el centro: la textura se ve en los márgenes y la
 * zona donde va el texto queda limpia, sin comprometer el contraste.
 */
export function Backdrop({
  variant = "soft",
  image,
  imageDistance = 70,
  className,
}: {
  /**
   * `soft`  halos verdes/azules muy abiertos.
   * `warm`  halos ámbar/rosa, para romper la monotonía del verde.
   * `cool`  halos violeta/cian.
   * `grid`  solo la malla de puntos, sin halos.
   */
  variant?: "soft" | "warm" | "cool" | "grid";
  /** Fotografía de fondo (ruta dentro de /public). */
  image?: string;
  /** Recorrido del parallax de la fotografía, en píxeles. */
  imageDistance?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {image && (
        <ParallaxLayer distance={imageDistance}>
          <Image
            src={image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.07] [mask-image:radial-gradient(ellipse_at_center,transparent_18%,black_78%)] dark:opacity-[0.13]"
          />
        </ParallaxLayer>
      )}

      {/* Malla de puntos, desvanecida hacia los bordes */}
      <div className="bg-dots-fine absolute inset-0 opacity-80 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />

      {variant === "soft" && (
        <>
          <div className="absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-hue-green/16 blur-[130px]" />
          <div className="absolute -right-40 top-1/3 h-[26rem] w-[26rem] rounded-full bg-hue-blue/16 blur-[130px]" />
        </>
      )}

      {variant === "warm" && (
        <>
          <div className="absolute -left-40 top-0 h-[26rem] w-[26rem] rounded-full bg-hue-amber/16 blur-[130px]" />
          <div className="absolute -right-32 bottom-0 h-[26rem] w-[26rem] rounded-full bg-hue-rose/16 blur-[130px]" />
        </>
      )}

      {variant === "cool" && (
        <>
          <div className="absolute -left-32 bottom-0 h-[26rem] w-[26rem] rounded-full bg-hue-violet/16 blur-[130px]" />
          <div className="absolute -right-32 -top-20 h-[26rem] w-[26rem] rounded-full bg-hue-cyan/16 blur-[130px]" />
        </>
      )}
    </div>
  );
}

/**
 * Trazo de marca: el swoosh del logotipo, en grande y muy tenue.
 * Se usa como firma visual en las secciones oscuras.
 */
export function BrandSwoosh({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 300"
      fill="none"
      className={cn("pointer-events-none absolute", className)}
    >
      <defs>
        <linearGradient id="swooshGrad" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0%" stopColor="var(--color-brand-blue)" />
          <stop offset="100%" stopColor="var(--color-brand-green)" />
        </linearGradient>
      </defs>
      <path
        d="M0 268C250 44 550 44 800 8"
        stroke="url(#swooshGrad)"
        strokeWidth="30"
        strokeLinecap="round"
        opacity="0.16"
      />
      <path
        d="M0 292C260 96 560 96 800 52"
        stroke="url(#swooshGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.22"
      />
    </svg>
  );
}

/** Retícula de puntos en formato SVG, para esquinas concretas. */
export function DotGrid({
  className,
  rows = 5,
  cols = 5,
}: {
  className?: string;
  rows?: number;
  cols?: number;
}) {
  const step = 14;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${cols * step} ${rows * step}`}
      className={cn("pointer-events-none absolute", className)}
      fill="currentColor"
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={c * step + step / 2}
            cy={r * step + step / 2}
            r="2"
          />
        )),
      )}
    </svg>
  );
}

/**
 * Anillos orbitales: el motivo de esfera del isotipo, en trazo fino.
 * Toma el color de `currentColor`, así que el tono se da con `text-*`.
 */
export function OrbitRings({
  className,
  spin = false,
}: {
  className?: string;
  /** Giro muy lento (se detiene con prefers-reduced-motion). */
  spin?: boolean;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      fill="none"
      className={cn(
        "pointer-events-none absolute",
        spin && "animate-spin-slow",
        className,
      )}
    >
      <g stroke="currentColor" strokeWidth="1.2">
        <circle cx="100" cy="100" r="94" />
        <ellipse cx="100" cy="100" rx="94" ry="40" />
        <ellipse cx="100" cy="100" rx="40" ry="94" />
        <circle cx="100" cy="100" r="62" strokeDasharray="3 6" />
      </g>
      {/* Satélites sobre las órbitas */}
      <circle cx="194" cy="100" r="4" fill="var(--color-brand-green)" />
      <circle cx="100" cy="6" r="3" fill="var(--color-brand-blue)" />
      <circle cx="56" cy="144" r="2.5" fill="var(--color-brand-green)" />
    </svg>
  );
}

/**
 * Mancha orgánica con el degradado de marca (verde → azul). Se usa detrás de
 * imágenes y tarjetas para darles profundidad sin recurrir a halos borrosos.
 */
export function GradientBlob({
  className,
  opacity = 0.18,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 600"
      className={cn("pointer-events-none absolute", className)}
    >
      <defs>
        <linearGradient id="blobGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-green)" />
          <stop offset="100%" stopColor="var(--color-brand-blue)" />
        </linearGradient>
      </defs>
      <path
        fill="url(#blobGrad)"
        opacity={opacity}
        d="M421.5 76.3c55.4 35.6 108.4 92.3 115 156.6 6.7 64.3-33 136.2-86.3 186.4-53.3 50.2-120.2 78.6-186.6 74.4-66.4-4.2-132.3-40.9-165-97.7C66 339.2 66.6 262.3 98 199.6 129.5 137 191.8 88.6 256.6 66.2c64.8-22.4 109.5-25.5 164.9 10.1Z"
      />
    </svg>
  );
}

/** Cruz pequeña, para salpicar esquinas. Toma `currentColor`. */
export function PlusMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("pointer-events-none absolute", className)}
    >
      <path
        d="M12 3v18M3 12h18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Arcos concéntricos (cuarto de círculo) para anclar una esquina de sección.
 * Toma `currentColor`.
 */
export function CornerArcs({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      fill="none"
      className={cn("pointer-events-none absolute", className)}
    >
      <g stroke="currentColor" strokeWidth="1.2">
        {[60, 100, 140, 180].map((r) => (
          <path key={r} d={`M${200 - r} 200A${r} ${r} 0 0 1 200 ${200 - r}`} />
        ))}
      </g>
    </svg>
  );
}
