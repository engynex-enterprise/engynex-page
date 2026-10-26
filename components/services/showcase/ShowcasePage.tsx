import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { buttonClasses } from "@/components/ui/Button";
import { StickyBar } from "@/components/ui/StickyBar";
import { CardRail } from "@/components/ui/CardRail";
import { Accordion } from "@/components/Accordion";
import { PricingTable } from "@/components/PricingTable";
import { CtaBand } from "@/components/sections/CtaBand";
import { TechStack } from "@/components/services/ServiceSections";
import { AuditForm } from "@/components/services/showcase/AuditForm";
import { ShowcaseProcess } from "@/components/services/showcase/ShowcaseProcess";
import { IntegrationCatalog } from "@/components/services/showcase/IntegrationCatalog";
import { UseCaseExplorer } from "@/components/services/showcase/UseCaseExplorer";
import { RentalQuote } from "@/components/services/showcase/RentalQuote";
import { SHOWCASE_ICONS as ICONS } from "@/components/services/showcase/icons";
import { BeforeAfter, CaseStudy, CompareModels, FlowSection, GovernanceSection, GuaranteesSection, IndustriesSection, PlatformsSection, ShowcaseHeading as Heading, SquadSection } from "@/components/services/showcase/ShowcaseFactory";
import { DomainSearch } from "@/components/domains/DomainSearch";
import { domainSearchCopy } from "@/content/domainSearch";
import { CashVisual, DashboardVisual, EditorVisual, FunnelVisual, InventoryVisual, SwapVisual, ScoreRing, TimelineVisual } from "@/components/services/showcase/ShowcaseVisuals";
import type { ShowcaseCopy } from "@/content/servicePages/types";
import { services, type Service } from "@/content/services";
import { servicePlans, formatCOP } from "@/content/pricing";
import { extraServiceFaqs } from "@/content/faqs";
import { getServiceProcess } from "@/content/serviceProcess";
import { serviceStack } from "@/content/serviceExtras";
import { projects } from "@/content/portfolio";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { localizedHref, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";



/**
 * Página insignia de un servicio (Desarrollo Web, Plataformas Web…). Toma de meta.com la cabecera a sangre
 * con titular enorme, la fila de accesos, la tarjeta destacada y la rejilla
 * de tarjetas fotográficas; de Netguru los servicios por capa y los casos
 * con métricas; de Webflow los resultados con ilustración; de Vercel la
 * banda de rendimiento. Reutiliza proceso, stack, planes y preguntas.
 */
export function ShowcasePage({ service, locale, dict, copy: t }: { service: Service; locale: Locale; dict: Dictionary; copy: ShowcaseCopy }) {
  const st = dict.servicesPage;
  const copy = service[locale];
  const contactHref = localizedHref(locale, "contacto");
  const plans = servicePlans[service.slug] ?? [];
  const cheapest = plans.filter((p): p is typeof p & { price: number } => p.price !== null).sort((a, b) => a.price - b.price)[0];
  const startingPrice = cheapest ? `${formatCOP(cheapest.price)}${cheapest.billing === "monthly" ? ` ${st.plans.monthly}` : ""}` : undefined;
  const process = getServiceProcess(service.slug)?.[locale];
  const faqs = [...copy.faqs, ...(extraServiceFaqs[service.slug]?.[locale] ?? [])];
  const cases = t.cases.slugs.map((s) => projects.find((p) => p.slug === s)).filter((p): p is NonNullable<typeof p> => !!p);
  const related = services.filter((s) => s.slug !== service.slug);
  const hrefFor = (h: string) => (h === "plans" ? "#planes" : h.startsWith("#") ? h : localizedHref(locale, `servicios/${h}`));

  return (
    <>
      {/* 1. Cabecera a sangre (meta.com) */}
      <section className="relative isolate flex min-h-[38rem] flex-col overflow-hidden bg-deep-950 text-white sm:min-h-[44rem] lg:min-h-[min(calc(100svh-6.5rem),58rem)]">
        <Image src={t.hero.image} alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[60%_center]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/15 to-black/70" aria-hidden />
        <Container className="flex flex-1 flex-col pb-10 pt-24 sm:pb-14 sm:pt-28">
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-brand-green">{t.hero.eyebrow}</p>
          {/* Los titulares largos bajan de tamaño para no empujar el texto y los botones */}
          <h1
            className={cn(
              "mt-4 text-balance font-bold leading-[0.95] tracking-[-0.035em]",
              t.hero.title.length > 32 ? "max-w-[16ch] text-[clamp(2.6rem,5.6vw,5.5rem)]" : "max-w-[13ch] text-[clamp(3rem,7.6vw,7.25rem)]",
            )}
          >
            {t.hero.title}
          </h1>
          <div className="mt-auto flex flex-col gap-8 pt-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-md">
              <p className="text-lg font-medium leading-snug text-white/95 sm:text-xl">{t.hero.subtitle}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={contactHref} className={buttonClasses("primary", "lg")}>
                  {t.hero.primary}
                </Link>
                <Link href={t.hero.secondaryHref ?? localizedHref(locale, "portafolio")} className={buttonClasses("glass", "lg")}>
                  {t.hero.secondary}
                </Link>
              </div>
            </div>
            <p aria-hidden className="hidden text-right text-[clamp(3.5rem,6.4vw,6.5rem)] font-bold leading-none tracking-[-0.04em] text-white/95 lg:block">
              {t.hero.wordmark}
            </p>
          </div>
        </Container>
      </section>

      <StickyBar title={copy.title} priceLabel={startingPrice ? dict.ui.from : undefined} price={startingPrice} action={{ label: dict.ui.quote, href: contactHref }} />

      {/* 2. Prueba social (Netguru "Trusted by") */}
      <section className="border-b border-line bg-surface">
        <Container>
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {t.proof.map((p, i) => (
              <div key={p.label} className={cn("py-7 sm:py-9", i % 2 === 1 && "pl-6 sm:pl-10", "lg:pl-10 lg:first:pl-0", i > 0 && "lg:border-l lg:border-line", i % 2 === 1 && "border-l border-line lg:border-l")}>
                <dt className="sr-only">{p.label}</dt>
                <dd>
                  <span className="block text-[clamp(1.9rem,3vw,2.6rem)] font-bold leading-none tracking-tight text-heading">{p.value}</span>
                  <span className="mt-2 block text-sm text-muted">{p.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Buscador de dominios (Hostinger / GoDaddy) */}
      {t.domains && (
        <section id="dominios" className="scroll-mt-32 bg-mesh-soft py-16 text-body sm:py-24">
          <Container>
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-green-dark dark:text-brand-green">{domainSearchCopy[locale].eyebrow}</p>
              <h2 className="mt-3 text-balance text-[clamp(2rem,3.8vw,3.2rem)] font-bold leading-[1.08] text-heading">{domainSearchCopy[locale].title}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{domainSearchCopy[locale].subtitle}</p>
            </div>
            <DomainSearch locale={locale} />
          </Container>
        </section>
      )}

      {/* 3. Fila de accesos (las fichas de producto de meta.com) */}
      <section className="bg-surface pt-14 sm:pt-20">
        <Container>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-2xl font-bold text-heading sm:text-[1.75rem]">{t.tiles.title}</h2>
            <p className="text-sm text-muted">{t.tiles.hint}</p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            {t.solutions.map((s) => {
              const Icon = ICONS[s.icon];
              return (
                <li key={s.key}>
                  <a
                    href={`#sol-${s.key}`}
                    className="group flex h-full flex-col items-center gap-3 rounded-3xl bg-surface-soft px-4 py-6 text-center transition-colors hover:bg-card-soft dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-deep-700 shadow-sm transition-transform group-hover:-translate-y-0.5 dark:bg-white/10 dark:text-white">
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <span className="text-[0.95rem] font-semibold leading-tight text-heading">{s.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* 4. Tarjeta destacada (meta.com) */}
      <section className="bg-surface pt-4 sm:pt-6">
        <Container>
          <Reveal className="relative isolate flex min-h-[30rem] items-end justify-center overflow-hidden rounded-[2rem] px-6 pb-12 text-center text-white sm:min-h-[36rem] sm:pb-16">
            <Image src={t.featured.image} alt="" fill sizes="(min-width: 1440px) 1376px, 100vw" className="-z-20 object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/10" aria-hidden />
            <div className="max-w-2xl">
              <p className="text-base font-medium text-white/90">{t.featured.eyebrow}</p>
              <h2 className="mt-2 text-balance text-[clamp(2rem,4.4vw,3.5rem)] font-bold leading-[1.05] tracking-tight">{t.featured.title}</h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">{t.featured.body}</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href={contactHref} className={buttonClasses("primary", "md")}>
                  {dict.ui.quote}
                </Link>
                <a href="#proceso" className={buttonClasses("glass", "md")}>
                  {t.featured.cta}
                </a>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 5. Tipos de sitio: rejilla de tarjetas fotográficas (meta.com) */}
      <Section tone="light" className="pt-16 sm:pt-24">
        <Heading title={t.solutionsTitle} subtitle={t.solutionsSubtitle} className="mb-10 sm:mb-14" />
        {t.useCases ? (
          <UseCaseExplorer
            items={t.useCases.items.flatMap((u) => {
              const sol = t.solutions.find((x) => x.key === u.key);
              return sol ? [{ ...u, icon: sol.icon, image: sol.image, eyebrow: sol.eyebrow, title: sol.title, body: sol.body, more: sol.more, href: hrefFor(sol.href) }] : [];
            })}
            labels={t.useCases}
            contactHref={contactHref}
            quoteLabel={dict.ui.quote}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
            {t.solutions.map((sol, i) => {
              const s = sol;
              return (
                <Reveal
                  key={s.key}
                  delay={(i % 2) * 80}
                  className="relative isolate flex min-h-[26rem] scroll-mt-40 flex-col items-center justify-end overflow-hidden rounded-[2rem] px-6 pb-10 text-center text-white sm:min-h-[32rem]"
                >
                  <span id={`sol-${s.key}`} className="absolute -top-40" aria-hidden />
                  <Image src={s.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="-z-20 object-cover transition-transform duration-700 hover:scale-[1.02]" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-black/5" aria-hidden />
                  <p className="text-base font-medium text-white/90">{sol.eyebrow}</p>
                  <h3 className="mt-1 text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.05] tracking-tight">{sol.title}</h3>
                  <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-white/85">{sol.body}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link href={contactHref} className={buttonClasses("primary", "md")}>
                      {dict.ui.quote}
                    </Link>
                    <Link href={hrefFor(s.href)} className={buttonClasses("glass", "md")}>
                      {sol.more}
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </Section>

      {/* 6. Servicios por capa (Netguru) */}
      <Section tone="muted">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
          <h2 className="text-[clamp(2rem,3.4vw,2.85rem)] leading-[1.12] text-heading">
            <span className="block font-normal">{t.capabilities.titleLight}</span>
            <span className="block font-bold">{t.capabilities.titleBold}</span>
          </h2>
          <p className="self-end text-base leading-relaxed text-muted sm:text-lg">{t.capabilities.intro}</p>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {t.capabilities.items.map((item, i) => {
            const Icon = ICONS[item.icon];
            return (
              <Reveal key={item.title} as="li" delay={(i % 4) * 60} className="flex flex-col rounded-3xl bg-card p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-brand-green-dark dark:text-brand-green">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold leading-snug text-heading">{item.title}</h3>
                <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted">{item.body}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-medium text-heading dark:bg-white/[0.06]">
                      {tag}
                    </span>
                  ))}
                </div>
              </Reveal>
            );
          })}
        </ul>
      </Section>

      {t.flow && <FlowSection copy={t.flow} />}

      {t.platforms && <PlatformsSection copy={t.platforms} />}

      {t.quote && (
        <Section tone="light" id="cotizador" className="scroll-mt-32">
          <RentalQuote copy={t.quote} locale={locale} />
        </Section>
      )}

      {t.catalog && (
        <Section tone="muted" id="sistemas" className="scroll-mt-32">
          <Heading title={t.catalog.title} subtitle={t.catalog.subtitle} className="mb-10 sm:mb-12" />
          <IntegrationCatalog copy={t.catalog} />
        </Section>
      )}

      {t.factory && <SquadSection copy={t.factory.squad} />}

      {/* 7. Resultados con ilustración (Webflow) */}
      <Section tone="light">
        <Heading title={t.outcomes.title} subtitle={t.outcomes.subtitle} className="mb-12 sm:mb-16" />
        {t.outcomes.compare && (
          <div className="mb-16 sm:mb-24">
            <BeforeAfter copy={t.outcomes.compare} />
          </div>
        )}
        <div className="grid gap-10 md:grid-cols-3 md:gap-6 lg:gap-8">
          {t.outcomes.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              {t.outcomes.visual.rental ? (
                <>
                  {i === 0 && <CashVisual {...t.outcomes.visual.rental} />}
                  {i === 1 && <SwapVisual steps={t.outcomes.visual.rental.swap} />}
                  {i === 2 && <InventoryVisual title={t.outcomes.visual.rental.inventoryTitle} rows={t.outcomes.visual.rental.inventory} />}
                </>
              ) : (
                <>
                {i === 0 && <TimelineVisual week={t.outcomes.visual.week} review={t.outcomes.visual.review} live={t.outcomes.visual.live} />}
                {i === 1 && <FunnelVisual rows={t.outcomes.visual.funnel} />}
                {i === 2 &&
                  (t.outcomes.visual.dashboard ? (
                    <DashboardVisual title={t.outcomes.visual.editor} kpis={t.outcomes.visual.dashboard.kpis} alert={t.outcomes.visual.dashboard.alert} />
                  ) : (
                    <EditorVisual editor={t.outcomes.visual.editor} publish={t.outcomes.visual.publish} saved={t.outcomes.visual.saved} />
                  ))}
                </>
              )}
              <h3 className="mt-6 text-xl font-bold leading-snug text-heading">{item.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {t.factory && <IndustriesSection copy={t.factory.industries} />}

      {/* 8. Rendimiento y seguridad (Vercel) */}
      <Section tone="dark" className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-brand-green/10 blur-3xl" aria-hidden />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-green">{t.performance.eyebrow}</p>
            <h2 className="mt-4 text-balance text-[clamp(2rem,3.8vw,3.25rem)] font-bold leading-[1.08] text-white">{t.performance.title}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-100/80 sm:text-lg">{t.performance.subtitle}</p>
            <ul className="mt-8 grid gap-3">
              {t.performance.security.map((s) => (
                <li key={s} className="flex items-start gap-3 text-[0.95rem] text-ink-100/90">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-10">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-4">
              {t.performance.scores.map((s) => (
                <ScoreRing key={s.label} value={s.value} label={s.label} display={s.display} />
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-ink-100/60">{t.performance.scoresNote}</p>
            <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
              {t.performance.vitals.map((v) => (
                <div key={v.metric} className="bg-deep-950/80 p-5">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-100/60">{v.metric}</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums text-brand-green">{v.target}</dd>
                  <dd className="mt-1 text-sm text-ink-100/75">{v.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      {t.factory && <GovernanceSection copy={t.factory.governance} />}

      {/* 9. Casos con métricas (Netguru) */}
      {cases.length > 0 && (
        <Section tone="light">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4 sm:mb-16">
            <div>
              <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.12] text-heading">{t.cases.title}</h2>
              <p className="mt-3 text-base text-muted sm:text-lg">{t.cases.subtitle}</p>
            </div>
            <Link href={localizedHref(locale, "portafolio")} className={buttonClasses("outline", "md")}>
              {t.cases.cta}
            </Link>
          </div>
          <div className={cn("grid", t.cases.details ? "gap-6 sm:gap-8" : "gap-16 sm:gap-24")}>
            {cases.map((p, i) => {
              const detail = t.cases.details?.[p.slug];
              if (detail && t.cases.labels) {
                return <CaseStudy key={p.slug} project={{ ...p[locale], image: p.image }} detail={detail} labels={t.cases.labels} reverse={i % 2 === 1} />;
              }
              return (
                <Reveal key={p.slug} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                  <div className={cn(i % 2 === 1 && "lg:order-2")}>
                    <h3 className="text-[clamp(1.6rem,2.6vw,2.25rem)] leading-[1.15] text-heading">
                      <span className="font-normal">{p[locale].title}: </span>
                      <span className="font-bold">{p[locale].result}</span>
                    </h3>
                    <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{p[locale].summary}</p>
                    <ol className="mt-8 grid max-w-md grid-cols-3 gap-2">
                      {p.tags.slice(0, 3).map((tag, j) => (
                        <li key={tag} className="rounded-2xl bg-surface-soft p-4 dark:bg-white/[0.04]">
                          <span className="block text-2xl font-semibold tabular-nums text-heading">{String(j + 1).padStart(2, "0")}</span>
                          <span className="mt-1 block truncate text-sm text-muted">{tag}</span>
                        </li>
                      ))}
                    </ol>
                    <Link href={localizedHref(locale, "portafolio")} className="mt-8 inline-flex items-center gap-1.5 text-base font-semibold text-heading underline-offset-4 hover:underline">
                      {t.cases.link}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                  <div className={cn("relative aspect-[4/3] overflow-hidden rounded-[2rem]", i % 2 === 1 && "lg:order-1")}>
                    <Image src={p.image} alt={p[locale].title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Section>
      )}

      {/* 10. Proceso con flechas */}
      {process && (
        <ShowcaseProcess
          eyebrow={process.eyebrow}
          title={process.title}
          subtitle={process.subtitle}
          steps={process.steps}
          icons={(t.processIcons ?? ["clipboard", "palette", "code", "rocket"]).map((k) => ICONS[k])}
          stepLabel={t.process.stepLabel}
          ctaTitle={t.process.ctaTitle}
          ctaLabel={t.process.ctaLabel}
          ctaHref={contactHref}
        />
      )}

      {/* 11. Tecnologías */}
      {(serviceStack[service.slug] ?? []).length > 0 && <TechStack items={serviceStack[service.slug]} copy={st.extras.stack} tone="light" />}

      {/* 12. Modelos de trabajo (Netguru / BairesDev) */}
      <Section tone="muted" id="modelos" className="scroll-mt-32">
        <Heading title={t.models.title} subtitle={t.models.subtitle} className="mb-12 sm:mb-16" />
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          {t.models.items.map((m, i) => {
            const dark = i === 1;
            return (
              <Reveal
                key={m.name}
                delay={i * 80}
                className={cn("flex flex-col rounded-[2rem] p-8", dark ? "bg-deep-700 text-white dark:bg-white/[0.08]" : "bg-card")}
              >
                <p className={cn("text-sm font-medium", dark ? "text-brand-green" : "text-brand-green-dark dark:text-brand-green")}>{m.fit}</p>
                <h3 className={cn("mt-2 text-[1.75rem] font-bold leading-tight", dark ? "text-white" : "text-heading")}>{m.name}</h3>
                <p className={cn("mt-3 text-base leading-relaxed", dark ? "text-white/80" : "text-muted")}>{m.body}</p>
                <ul className="mt-6 grid flex-1 content-start gap-2.5">
                  {m.points.map((pt) => (
                    <li key={pt} className={cn("flex items-center gap-2.5 text-[0.95rem]", dark ? "text-white" : "text-heading")}>
                      <Check className={cn("h-4 w-4 shrink-0", dark ? "text-brand-green" : "text-accent")} strokeWidth={2.5} aria-hidden />
                      {pt}
                    </li>
                  ))}
                </ul>
                <Link
                  href={i === 2 ? `https://wa.me/${siteConfig.whatsapp}` : "#planes"}
                  {...(i === 2 ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={cn(buttonClasses(dark ? "primary" : "outline", "md"), "mt-8 self-start")}
                >
                  {m.cta}
                  {i === 2 && <ArrowUpRight className="h-4 w-4" aria-hidden />}
                </Link>
              </Reveal>
            );
          })}
        </div>
        {t.factory && <CompareModels copy={t.factory.compare} models={t.models.items.map((m) => m.name)} />}
      </Section>

      {t.factory && <GuaranteesSection copy={t.factory.guarantees} />}

      {/* 13. Planes */}
      {plans.length > 0 && (
        <Section tone="light" id="planes" className="scroll-mt-32">
          <Heading title={st.plans.title} subtitle={st.plans.subtitle} className="mb-12 sm:mb-16" />
          <PricingTable plans={plans} locale={locale} t={st.plans} badges={dict.badges} ctaHref={contactHref} surface="soft" />
          <div className="mt-14 rounded-[2rem] bg-surface-soft p-8 sm:p-10 dark:bg-white/[0.04]">
            <h3 className="text-xl font-bold text-heading">{t.included.title}</h3>
            <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {t.included.items.map((it) => (
                <li key={it} className="flex items-start gap-2.5 text-[0.95rem] text-heading">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} aria-hidden />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* 14. Diagnóstico gratuito (el registro de meta.com) */}
      {t.audit && (
        <section className="border-y border-line bg-surface py-14 sm:py-20">
          <Container>
            <AuditForm
              title={t.audit.title}
              body={t.audit.body}
              label={t.audit.label}
              placeholder={t.audit.placeholder}
              cta={t.audit.cta}
              note={t.audit.note}
              message={t.audit.message}
              kind={t.audit.kind}
            />
          </Container>
        </section>
      )}

      {/* 15. Preguntas frecuentes */}
      <Section tone="muted" id="faq" className="scroll-mt-32">
        <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">{dict.ui.faqTitle}</h2>
        <Accordion items={faqs} className="mt-10 sm:mt-12" />
        <h3 className="mt-16 text-2xl font-bold text-heading sm:mt-20 sm:text-[1.75rem]">{st.commonFaqsTitle}</h3>
        <Accordion items={st.commonFaqs} defaultOpen={null} className="mt-6 sm:mt-8" />
      </Section>

      {/* 16. Otros servicios */}
      <section className="bg-surface py-16 text-body sm:py-24">
        <Container className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">{st.detail.relatedTitle}</h2>
          <Link href={localizedHref(locale, "servicios")} className={buttonClasses("outline", "md")}>
            {dict.ui.viewAll}
          </Link>
        </Container>
        <CardRail
          label={st.detail.relatedTitle}
          prevLabel={dict.ui.prev}
          nextLabel={dict.ui.next}
          cards={related.map((s) => ({
            key: s.slug,
            title: s[locale].title,
            caption: s[locale].tagline,
            image: s.image,
            href: localizedHref(locale, `servicios/${s.slug}`),
          }))}
        />
      </section>

      <CtaBand
        locale={locale}
        title={st.detail.ctaTitle}
        subtitle={st.detail.ctaSubtitle}
        primaryLabel={st.ctaService}
        secondaryLabel={dict.common.viewServices}
        secondaryHref={localizedHref(locale, "servicios")}
      />
    </>
  );
}
