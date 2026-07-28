import { cn } from "@/lib/utils";

/**
 * Capa decorativa de sección: halos de color difuminados, malla de puntos y,
 * opcionalmente, un trazo vectorial de marca.
 *
 * Va dentro de una sección con `position: relative` y siempre por detrás del
 * contenido (`-z-10`), así que nunca intercepta clics.
 */
export function Backdrop({
  variant = "soft",
  className,
}: {
  /**
   * `soft`  halos verdes/azules muy abiertos.
   * `warm`  halos ámbar/rosa, para romper la monotonía del verde.
   * `cool`  halos violeta/cian.
   * `grid`  solo la malla de puntos, sin halos.
   */
  variant?: "soft" | "warm" | "cool" | "grid";
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
      {/* Malla de puntos, desvanecida hacia los bordes */}
      <div className="bg-dots-fine absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />

      {variant === "soft" && (
        <>
          <div className="absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-hue-green/12 blur-[130px]" />
          <div className="absolute -right-40 top-1/3 h-[26rem] w-[26rem] rounded-full bg-hue-blue/12 blur-[130px]" />
        </>
      )}

      {variant === "warm" && (
        <>
          <div className="absolute -left-40 top-0 h-[26rem] w-[26rem] rounded-full bg-hue-amber/12 blur-[130px]" />
          <div className="absolute -right-32 bottom-0 h-[26rem] w-[26rem] rounded-full bg-hue-rose/12 blur-[130px]" />
        </>
      )}

      {variant === "cool" && (
        <>
          <div className="absolute -left-32 bottom-0 h-[26rem] w-[26rem] rounded-full bg-hue-violet/12 blur-[130px]" />
          <div className="absolute -right-32 -top-20 h-[26rem] w-[26rem] rounded-full bg-hue-cyan/12 blur-[130px]" />
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
