import Image from "next/image";
import { Container } from "@/components/ui/Container";

/**
 * Cabecera de las páginas interiores al estilo meta.com: fotografía a sangre
 * justo bajo la barra de navegación y, abajo a la izquierda, el titular grande
 * en blanco. Sin imagen cae a un fondo pizarra liso.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Fotografía de fondo (ruta dentro de /public). */
  image?: string;
}) {
  return (
    <section className="relative isolate flex min-h-[30rem] items-end overflow-hidden bg-deep-800 pt-16 text-white lg:min-h-[38rem]">
      {image && (
        <>
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/30 to-black/10"
          />
        </>
      )}

      <Container className="pb-12 pt-24 sm:pb-16">
        <p className="text-sm font-medium text-white/85">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-balance text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.02] tracking-[-0.03em] text-white">
          {title}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
          {subtitle}
        </p>
      </Container>
    </section>
  );
}
