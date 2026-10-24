import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MediaTile } from "@/components/ui/MediaTile";
import { buttonClasses } from "@/components/ui/Button";
import { getService } from "@/content/services";
import { products } from "@/content/products";
import { projects, categoryLabels } from "@/content/portfolio";
import { servicePlans, formatCOP } from "@/content/pricing";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Secciones del home con el lenguaje de meta.com: un titular centrado y una
 * vitrina de tarjetas fotográficas (una a todo el ancho y luego parejas), una
 * repisa de productos y "lo último" con la foto arriba y el título debajo.
 */

/** Orden de la vitrina: `wide` va a todo el ancho; el resto, en parejas. */
const showcase: ({ kind: "wide" | "pair"; slugs: string[] } | { kind: "subscription" })[] = [
  { kind: "wide", slugs: ["desarrollo-web"] },
  { kind: "pair", slugs: ["plataformas-web", "apps-moviles"] },
  { kind: "pair", slugs: ["ecommerce", "ia-automatizacion"] },
  { kind: "subscription" },
  { kind: "pair", slugs: ["marketing-digital", "ux-ui-branding"] },
  { kind: "pair", slugs: ["cloud-devops", "ciberseguridad"] },
  { kind: "wide", slugs: ["alquiler-equipos"] },
];

export function ServiceShowcase({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.homePage;
  const contact = localizedHref(locale, "contacto");
  const webPlan = servicePlans["desarrollo-web"]?.[0];

  const tileFor = (slug: string, size: "wide" | "half", priority = false) => {
    const service = getService(slug);
    if (!service) return null;
    const copy = service[locale];
    return (
      <MediaTile
        key={slug}
        size={size}
        priority={priority}
        image={service.image}
        kicker={copy.tagline}
        title={copy.title}
        primary={{ label: t.quote, href: contact }}
        secondary={{
          label: dict.common.learnMore,
          href: localizedHref(locale, `servicios/${slug}`),
        }}
      />
    );
  };

  return (
    <section className="bg-surface pb-16 pt-14 sm:pb-24 sm:pt-20">
      <Container>
        <h2 className="mx-auto max-w-4xl text-balance text-center text-[clamp(1.75rem,2.8vw,2.25rem)] font-medium leading-tight text-heading">
          {t.exploreTitle}
        </h2>

        <div className="mt-10 grid gap-4 sm:mt-14">
          {showcase.map((row, i) => {
            if (row.kind === "subscription") {
              if (webPlan?.price == null) return null;
              return (
                <MediaTile
                  key="subscription"
                  size="wide"
                  image="/images/svc-hosting-mantenimiento.jpg"
                  kicker={`${t.subscriptionKicker} · ${dict.subscriptionBand.priceLabel} ${formatCOP(webPlan.price)} ${dict.subscriptionBand.priceNote}`}
                  title={dict.subscriptionBand.title}
                  description={dict.subscriptionBand.desc}
                  primary={{
                    label: dict.subscriptionBand.cta,
                    href: `${localizedHref(locale, "servicios/desarrollo-web")}#planes`,
                  }}
                  secondary={{ label: t.quote, href: contact }}
                />
              );
            }
            if (row.kind === "wide") return tileFor(row.slugs[0], "wide", i === 0);
            return (
              <div key={row.slugs.join("-")} className="grid gap-4 md:grid-cols-2">
                {row.slugs.map((slug) => tileFor(slug, "half"))}
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href={localizedHref(locale, "servicios")}
            className={buttonClasses("secondary", "lg")}
          >
            {t.allServices}
          </Link>
        </div>
      </Container>
    </section>
  );
}

/** Repisa de productos: foto arriba, nombre y una línea, como una tienda. */
export function ProductShelf({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.homePage;

  return (
    <section className="bg-surface pb-16 sm:pb-24">
      <Container>
        <h2 className="text-center text-[clamp(1.75rem,2.8vw,2.25rem)] font-medium text-heading">
          {t.productsTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-muted sm:text-lg">
          {dict.productsSection.subtitle}
        </p>

        <ul className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => {
            const copy = product[locale];
            return (
              <li key={product.slug}>
                <Link
                  href={localizedHref(locale, `productos/${product.slug}`)}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl bg-surface-soft transition-colors hover:bg-card-soft"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    {product.badge && (
                      <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0a1317]">
                        {dict.badges[product.badge]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-medium text-heading">
                      {copy.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {copy.tagline}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                      {t.viewProduct}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-12 flex justify-center">
          <Link
            href={localizedHref(locale, "productos")}
            className={buttonClasses("secondary", "lg")}
          >
            {dict.productsSection.cta}
          </Link>
        </div>
      </Container>
    </section>
  );
}

/** "Lo último": dos casos con la foto arriba y el título debajo. */
export function LatestWork({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const href = localizedHref(locale, "portafolio");

  return (
    <section className="bg-surface py-16 sm:py-24">
      <Container>
        <h2 className="text-center text-[clamp(1.75rem,2.8vw,2.25rem)] font-medium text-heading">
          {dict.homePage.latestTitle}
        </h2>

        <ul className="mt-10 grid gap-x-4 gap-y-10 sm:mt-12 md:grid-cols-2">
          {projects.slice(0, 2).map((project) => {
            const copy = project[locale];
            return (
              <li key={project.slug}>
                <Link href={href} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-surface-soft">
                    <Image
                      src={project.image}
                      alt={copy.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-5 text-sm font-semibold text-accent">
                    {categoryLabels[project.category][locale]} · {copy.result}
                  </p>
                  <h3 className="mt-1.5 text-xl font-medium text-heading group-hover:underline group-hover:underline-offset-4">
                    {copy.title}
                  </h3>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
                    {copy.summary}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
