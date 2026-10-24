import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  href: string;
}

/**
 * Bloque dividido de meta.com: fotografía redondeada a un lado y, al otro,
 * titular en negrita, un párrafo y hasta dos botones. `reverse` pone la foto a
 * la derecha.
 */
export function SplitFeature({
  image,
  imageAlt = "",
  eyebrow,
  title,
  description,
  primary,
  secondary,
  reverse = false,
  children,
}: {
  image: string;
  imageAlt?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  primary?: Action;
  secondary?: Action;
  reverse?: boolean;
  /** Contenido extra bajo el párrafo (lista, cifras…). */
  children?: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-20">
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface-soft md:aspect-square lg:aspect-[5/4]",
          reverse && "md:order-2",
        )}
      >
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="max-w-xl">
        {eyebrow && (
          <p className="text-sm font-semibold text-accent">{eyebrow}</p>
        )}
        <h2 className="mt-2 text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
          {title}
        </h2>
        {description && (
          <p className="mt-5 text-lg leading-relaxed text-muted">
            {description}
          </p>
        )}
        {children}
        {(primary || secondary) && (
          <div className="mt-8 flex flex-wrap gap-3">
            {primary && (
              <Link href={primary.href} className={buttonClasses("primary", "lg")}>
                {primary.label}
              </Link>
            )}
            {secondary && (
              <Link
                href={secondary.href}
                className={buttonClasses("secondary", "lg")}
              >
                {secondary.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
