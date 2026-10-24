import Image from "next/image";
import { Container } from "@/components/ui/Container";

/**
 * Cabecera de las páginas de empresa, como about.meta.com: antetítulo
 * pequeño, titular grande centrado, una línea de apoyo y debajo una imagen
 * ancha con esquinas redondeadas.
 */
export function CompanyHero({
  eyebrow,
  title,
  subtitle,
  image,
  imageAlt = "",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <section className="bg-surface pb-16 pt-32 sm:pb-24 sm:pt-40">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-heading">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-balance text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.08] text-heading">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {subtitle}
            </p>
          )}
        </div>
        {image && (
          <div className="relative mx-auto mt-12 aspect-[16/9] max-w-5xl overflow-hidden rounded-3xl bg-surface-soft sm:mt-16">
            <Image
              src={image}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 1100px) 100vw, 64rem"
              className="object-cover"
            />
          </div>
        )}
      </Container>
    </section>
  );
}
