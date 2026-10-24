import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { serviceGallery } from "@/content/serviceExtras";
import { getServiceProcess } from "@/content/serviceProcess";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Producción audiovisual — "Formatos de entrega": cuatro encuadres con las
 * proporciones habituales de cada plataforma (horizontal, vertical, cuadrado
 * y retrato), con fotografía real del servicio. Cada entregable es el pie de
 * uno de los encuadres.
 */
const copy = {
  es: {
    lead: "Formatos de entrega",
    subtitle:
      "Desde la idea hasta las piezas finales: cada proyecto sale listo para la pantalla donde lo verá tu audiencia.",
    formats: [
      { ratio: "16:9", name: "Horizontal" },
      { ratio: "9:16", name: "Vertical" },
      { ratio: "1:1", name: "Cuadrado" },
      { ratio: "4:5", name: "Retrato" },
    ],
    delivery: "Entrega",
    example: "Ejemplo de encuadre",
  },
  en: {
    lead: "Delivery formats",
    subtitle:
      "From the idea to the final pieces: every project leaves ready for the screen where your audience will watch it.",
    formats: [
      { ratio: "16:9", name: "Landscape" },
      { ratio: "9:16", name: "Vertical" },
      { ratio: "1:1", name: "Square" },
      { ratio: "4:5", name: "Portrait" },
    ],
    delivery: "Delivery",
    example: "Sample framing,",
  },
};

/** Proporción CSS de cada encuadre, en el orden de `formats`. */
const aspect = [
  "aspect-[16/9]",
  "aspect-[9/16]",
  "aspect-square",
  "aspect-[4/5]",
];

function Frame({
  image,
  alt,
  ratio,
  className,
  sizes,
}: {
  image: string;
  alt: string;
  ratio: string;
  className: string;
  sizes: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-deep-900",
        className,
      )}
    >
      <Image
        src={image}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-deep-950/15" />
      {/* Guías de encuadre */}
      <span
        aria-hidden
        className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-white/80"
      />
      <span
        aria-hidden
        className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-white/80"
      />
      <span
        aria-hidden
        className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-white/80"
      />
      <span
        aria-hidden
        className="absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-white/80"
      />
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-deep-950/70 px-3 py-1 font-mono text-xs font-semibold text-white">
        {ratio}
      </span>
    </div>
  );
}

export const deliverables: DeliverablesDesign = ({
  service,
  locale,
  tone,
  title,
}) => {
  const c = service[locale];
  const t = copy[locale];
  const gallery = serviceGallery[service.slug] ?? [service.image];
  const lastStep = getServiceProcess(service.slug)?.[locale].steps.at(-1);

  const items = c.deliverables.map((item, i) => ({
    item,
    format: t.formats[i % t.formats.length],
    aspect: aspect[i % aspect.length],
    image: gallery[i % gallery.length],
    alt: `${t.example} ${t.formats[i % t.formats.length].name.toLowerCase()} ${t.formats[i % t.formats.length].ratio}`,
  }));
  // Un encuadre por formato; si hubiera más entregables, van en lista.
  const frames = items.slice(0, aspect.length);
  const extra = items.slice(aspect.length);

  const caption = (x: (typeof items)[number]) => (
    <figcaption className="mt-3 sm:mt-4">
      <p className="text-xs font-semibold text-muted">
        {x.format.ratio} · {x.format.name}
      </p>
      <p className="mt-1 text-sm font-bold leading-snug text-heading sm:text-base lg:text-lg">
        {x.item}
      </p>
    </figcaption>
  );

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
              {title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              <strong className="font-bold text-heading">{t.lead}.</strong>{" "}
              {t.subtitle}
            </p>
          </div>
          {lastStep && (
            <p className="shrink-0 text-sm text-muted lg:text-right">
              <span className="font-semibold text-heading">{t.delivery}:</span>{" "}
              {lastStep.title} · {lastStep.meta}
            </p>
          )}
        </div>

        {/*
          Las columnas usan fracciones iguales a la proporción de cada encuadre
          (16/9, 9/16, 1, 4/5): como el espacio sin huecos se reparte en esa
          proporción, todos quedan exactamente a la misma altura. En móvil el
          horizontal ocupa toda la fila.
        */}
        <div className="mt-12 grid grid-cols-2 items-start gap-x-3 gap-y-8 sm:mt-16 sm:grid-cols-[0.5625fr_1fr_0.8fr] sm:gap-x-4 lg:grid-cols-[1.778fr_0.5625fr_1fr_0.8fr] lg:gap-x-5">
          {frames.map((x, i) => (
            <figure
              key={x.item}
              className={cn(
                "min-w-0",
                i === 0 && "col-span-2 sm:col-span-3 lg:col-span-1",
              )}
            >
              <Frame
                image={x.image}
                alt={x.alt}
                ratio={x.format.ratio}
                className={x.aspect}
                sizes={
                  i === 0
                    ? "(min-width: 1024px) 40vw, 100vw"
                    : "(min-width: 1024px) 20vw, 50vw"
                }
              />
              {caption(x)}
            </figure>
          ))}
        </div>
        {extra.length > 0 && (
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {extra.map((x) => (
              <li key={x.item} className="text-base font-bold text-heading">
                {x.item}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
};
