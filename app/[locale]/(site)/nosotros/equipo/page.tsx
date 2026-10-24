import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Boxes,
  Check,
  Layers,
  Mail,
  UsersRound,
  Wrench,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MediaTile } from "@/components/ui/MediaTile";
import { SplitFeature } from "@/components/ui/SplitFeature";
import { SpecRow } from "@/components/ui/SpecRow";
import { buttonClasses } from "@/components/ui/Button";
import { CtaBand } from "@/components/sections/CtaBand";
import { CompanyHero } from "@/components/company/CompanyHero";
import { CompanySubnav } from "@/components/company/CompanySubnav";
import { ExploreCompany, companyImages } from "@/components/company/ExploreCompany";
import { companyB, teamAnchors, teamServiceSlugs } from "@/content/company-b";
import { services } from "@/content/services";
import { products } from "@/content/products";
import { getDictionary } from "@/i18n/dictionaries";
import { locales, isLocale, type Locale } from "@/i18n/config";
import { localizedHref, siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safe: Locale = isLocale(locale) ? locale : "es";
  const t = companyB[safe].team;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: `/${safe}/nosotros/equipo` },
  };
}

/** Foto de cada equipo (mismo orden que `aboutPage.team`). */
const teamImages = [
  "/images/svc-desarrollo-web.jpg",
  "/images/svc-ux-ui-branding.jpg",
  "/images/svc-marketing-digital.jpg",
  "/images/svc-produccion-audiovisual.jpg",
];

/**
 * El equipo: las cuatro áreas como tarjetas fotográficas grandes, una ficha
 * de cifras, qué servicios lidera cada equipo, cómo trabajan juntos y una
 * invitación a escribirnos para sumarse.
 */
export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = companyB[locale].team;
  const teams = dict.aboutPage.team;
  const href = (path: string) => localizedHref(locale, path);

  // El número de especialistas sale de las cifras de la página Nosotros.
  const specialists =
    dict.aboutPage.stats.find((stat) => /specialist|especialista/i.test(stat.label))
      ?.value ?? "";

  const servicesByTeam = teamServiceSlugs.map((slugs) =>
    slugs.flatMap((slug) => {
      const service = services.find((s) => s.slug === slug);
      return service ? [service] : [];
    }),
  );

  return (
    <>
      <CompanyHero
        eyebrow={t.hero.eyebrow}
        title={t.hero.title}
        subtitle={t.hero.subtitle}
        image={companyImages["nosotros/equipo"]}
        imageAlt={t.hero.imageAlt}
      />
      <CompanySubnav locale={locale} label={dict.company.subnavLabel} />

      {/* -------- Introducción y cifras -------- */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
              {t.intro.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              {t.intro.subtitle}
            </p>
          </div>
          <SpecRow
            className="mt-14"
            items={[
              ...(specialists
                ? [{ icon: UsersRound, value: specialists, label: t.specs.specialists }]
                : []),
              { icon: Layers, value: String(teams.length), label: t.specs.teams },
              { icon: Wrench, value: String(services.length), label: t.specs.services },
              { icon: Boxes, value: String(products.length), label: t.specs.products },
            ]}
          />

          {/* -------- Los cuatro equipos -------- */}
          <div className="mt-16 grid gap-4 sm:mt-20 md:grid-cols-2">
            {teams.map((team, i) => (
              <MediaTile
                key={team.name}
                image={teamImages[i] ?? "/images/about-team.jpg"}
                imageAlt={t.teamImageAlts[i] ?? ""}
                kicker={team.role}
                title={team.name}
                description={t.teamDescriptions[i]}
                primary={{
                  label: t.seeServices,
                  href: `#${teamAnchors[i]}`,
                }}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* -------- Qué hace cada equipo -------- */}
      <section className="bg-surface-soft py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] leading-[1.1] text-heading">
              {t.coverage.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              {t.coverage.subtitle}
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {teams.map((team, i) => (
              <article
                key={team.name}
                id={teamAnchors[i]}
                className="scroll-mt-36 rounded-3xl bg-card p-8 sm:p-10"
              >
                <p className="text-sm font-semibold text-accent">{team.role}</p>
                <h3 className="mt-2 text-[1.75rem] leading-tight text-heading">
                  {team.name}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-body">
                  {t.teamDescriptions[i]}
                </p>
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  {t.coverage.servicesLabel}
                </p>
                <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  {servicesByTeam[i]?.map((service) => (
                    <li key={service.slug}>
                      <Link
                        href={href(`servicios/${service.slug}`)}
                        className="group inline-flex items-start gap-1.5 py-1.5 text-sm font-semibold text-heading"
                      >
                        <ArrowUpRight
                          className="mt-0.5 h-4 w-4 shrink-0 text-muted group-hover:text-heading"
                          aria-hidden
                        />
                        <span className="group-hover:underline">
                          {service[locale].title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* -------- Trabajo coordinado -------- */}
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <SplitFeature
            image="/images/about-team.jpg"
            imageAlt={t.together.imageAlt}
            eyebrow={t.together.eyebrow}
            title={t.together.title}
            description={t.together.description}
            primary={{ label: t.together.cta, href: href("nosotros/proceso") }}
          >
            <ul className="mt-8 grid gap-5">
              {dict.whyUs.items.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <Check
                    className="mt-1 h-5 w-5 shrink-0 text-accent"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span>
                    <span className="block font-bold text-heading">{item.title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-body">
                      {item.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </SplitFeature>
        </Container>
      </section>

      {/* -------- Trabaja con nosotros -------- */}
      <section className="bg-surface-soft py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl bg-card px-6 py-12 text-center sm:px-12 sm:py-16">
            <h2 className="text-balance text-[clamp(1.75rem,3vw,2.25rem)] leading-tight text-heading">
              {t.join.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted">
              {t.join.description}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={href("contacto")} className={buttonClasses("dark", "lg")}>
                {t.join.cta}
              </Link>
              <a
                href={`mailto:${siteConfig.email}`}
                className={buttonClasses("secondary", "lg")}
              >
                <Mail className="h-4 w-4" aria-hidden />
                {t.join.email}
              </a>
            </div>
          </div>
        </Container>
      </section>

      <ExploreCompany
        locale={locale}
        current="nosotros/equipo"
        title={dict.company.exploreTitle}
      />

      <CtaBand
        locale={locale}
        title={dict.ctaBand.title}
        subtitle={dict.ctaBand.subtitle}
        primaryLabel={dict.ctaBand.primary}
        primaryHref={href("cotizar")}
        secondaryLabel={dict.ctaBand.secondary}
      />
    </>
  );
}
