import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface TileAction {
  label: string;
  href: string;
}

/**
 * Tarjeta fotográfica al estilo meta.com: imagen a sangre con radio de 24 px y,
 * centrados abajo, un antetítulo, un titular grande y hasta dos botones (azul
 * y gris translúcido). Un velo inferior garantiza el contraste del texto.
 *
 * `size="wide"` ocupa todo el ancho (602 px de alto en escritorio, como las
 * piezas destacadas de Meta); `size="half"` va en la rejilla de dos columnas.
 */
export function MediaTile({
  image,
  imageAlt = "",
  kicker,
  title,
  description,
  primary,
  secondary,
  size = "half",
  priority = false,
  className,
}: {
  image: string;
  imageAlt?: string;
  kicker?: string;
  title: string;
  description?: string;
  primary?: TileAction;
  secondary?: TileAction;
  size?: "wide" | "half";
  priority?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative isolate flex flex-col items-center justify-end overflow-hidden rounded-3xl bg-deep-800 px-6 pb-10 text-center text-white sm:pb-12",
        size === "wide"
          ? "min-h-[30rem] lg:min-h-[37.5rem]"
          : "min-h-[26rem] lg:min-h-[30rem]",
        className,
      )}
    >
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority={priority}
        sizes={size === "wide" ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
        className="-z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/5"
      />

      {kicker && (
        <p className="text-sm font-medium text-white/90">{kicker}</p>
      )}
      <h3
        className={cn(
          "mt-1.5 text-balance font-medium text-white",
          size === "wide"
            ? "text-[clamp(2rem,3.6vw,3rem)] leading-[1.15]"
            : "text-[clamp(1.75rem,2.8vw,2.25rem)] leading-[1.2]",
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-3 max-w-md text-base leading-relaxed text-white/85">
          {description}
        </p>
      )}
      {(primary || secondary) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {primary && (
            <Link href={primary.href} className={buttonClasses("primary", "md")}>
              {primary.label}
            </Link>
          )}
          {secondary && (
            <Link
              href={secondary.href}
              className={buttonClasses("glass", "md")}
            >
              {secondary.label}
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
