import { Search, Bell, CheckCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HeroActions, HeroBreadcrumb, toneClass } from "@/components/services/signatures/shared";
import { cn } from "@/lib/utils";
import { IntranetLauncher } from "./parts/intranet-launcher";
import type { ProductHeroProps, ProductSignature, ProductSignatureProps, Tone } from "./types";

/**
 * Intranet: la metáfora es la página de inicio del portal de la empresa.
 * La cabecera centra el titular y debajo abre una pantalla panorámica con
 * buscador, muro de noticias, accesos rápidos y directorio; la sección
 * insignia es un lanzador de módulos, como la pantalla de inicio de un
 * teléfono, con la vista previa del módulo elegido.
 */

const copy = {
  es: {
    brand: "Tu marca",
    search: "Buscar personas, documentos y formatos",
    hello: "Buenos días",
    feed: "Comunicados",
    news: [
      { area: "Gerencia", title: "Actualizamos la política de trabajo remoto" },
      { area: "Talento Humano", title: "Nuevo formato de solicitud de vacaciones" },
    ],
    read: "Leído",
    pending: "Confirmar lectura",
    quick: "Accesos rápidos",
    quickLinks: ["Solicitudes", "Documentos", "Calendario", "Reservar sala"],
    directory: "Directorio",
    teams: [
      { name: "Equipo de Ventas", role: "Comercial" },
      { name: "Talento Humano", role: "Personas" },
      { name: "Operaciones", role: "Logística" },
      { name: "Tecnología", role: "Soporte interno" },
    ],
    eyebrow: "Módulos",
    title: "Un portal, todas las herramientas internas",
    subtitle:
      "Cada módulo es una aplicación del portal. Elige uno para ver cómo se ve por dentro.",
    groupLabel: "Módulos de la intranet",
    previewLabel: "Vista previa",
  },
  en: {
    brand: "Your brand",
    search: "Search people, documents and forms",
    hello: "Good morning",
    feed: "Announcements",
    news: [
      { area: "Management", title: "We updated the remote work policy" },
      { area: "HR", title: "New vacation request form" },
    ],
    read: "Read",
    pending: "Confirm reading",
    quick: "Quick links",
    quickLinks: ["Requests", "Documents", "Calendar", "Book a room"],
    directory: "Directory",
    teams: [
      { name: "Sales Team", role: "Commercial" },
      { name: "Human Resources", role: "People" },
      { name: "Operations", role: "Logistics" },
      { name: "Technology", role: "Internal support" },
    ],
    eyebrow: "Modules",
    title: "One portal, every internal tool",
    subtitle:
      "Each module is an app inside the portal. Pick one to see what it looks like inside.",
    groupLabel: "Intranet modules",
    previewLabel: "Preview",
  },
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function Hero({ product, locale, backLabel, backHref, categoryLabel, primary, secondary }: ProductHeroProps) {
  const c = product[locale];
  const t = copy[locale];

  return (
    <section className="overflow-hidden bg-surface-soft pt-28 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} />
        <div className="mx-auto mt-8 max-w-4xl text-center">
          {categoryLabel && <p className="text-sm font-semibold text-accent">{categoryLabel}</p>}
          <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
            {c.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-body sm:text-xl">
            {c.tagline}. {c.description}
          </p>
          <HeroActions primary={primary} secondary={secondary} className="mt-8 justify-center" />
        </div>

        {/* Inicio del portal (ilustrativo). Se corta en el borde inferior, como una pantalla que sigue. */}
        <div aria-hidden className="mx-auto mt-14 max-w-6xl sm:mt-16">
          <div className="rounded-t-3xl bg-card p-2.5 pb-0 shadow-card-hover ring-1 ring-line sm:p-3 sm:pb-0">
            <div className="overflow-hidden rounded-t-[1.125rem] bg-surface ring-1 ring-line">
              {/* Barra superior con buscador */}
              <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:gap-4 sm:px-5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-deep-700 text-[0.65rem] font-bold text-brand-green">
                  TM
                </span>
                <span className="hidden text-sm font-bold text-heading sm:block">{t.brand}</span>
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-surface-soft px-4 py-2 text-sm text-muted ring-1 ring-line sm:mx-6">
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t.search}</span>
                </div>
                <Bell className="hidden h-5 w-5 shrink-0 text-muted sm:block" />
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-action text-[0.65rem] font-bold text-deep-700">
                  TÚ
                </span>
              </div>

              <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1.6fr_1fr] md:gap-6">
                {/* Muro de noticias */}
                <div>
                  <p className="text-xs font-medium text-muted">{t.hello}</p>
                  <p className="mt-1 text-lg font-bold text-heading">{c.features[0]}</p>
                  <div className="mt-4 space-y-3">
                    {t.news.map((n, i) => (
                      <div key={n.title} className="flex gap-4 rounded-2xl bg-surface-soft p-3 ring-1 ring-line sm:p-4">
                        <div
                          className={cn(
                            "hidden h-20 w-28 shrink-0 rounded-xl sm:block",
                            i === 0 ? "bg-deep-700" : "bg-accent-soft",
                          )}
                        >
                          <div className="flex h-full items-end gap-1 p-2.5">
                            <span className={cn("h-1.5 w-8 rounded-full", i === 0 ? "bg-brand-green" : "bg-accent/50")} />
                            <span className={cn("h-1.5 w-4 rounded-full", i === 0 ? "bg-white/30" : "bg-accent/25")} />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-accent">{n.area}</p>
                          <p className="mt-1 text-sm font-semibold leading-snug text-heading sm:text-base">{n.title}</p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <span className="h-1.5 w-24 rounded-full bg-line" />
                            {i === 0 ? (
                              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-[0.7rem] font-semibold text-accent">
                                <CheckCheck className="h-3.5 w-3.5" />
                                {t.read}
                              </span>
                            ) : (
                              <span className="ml-auto rounded-full bg-deep-700 px-2.5 py-0.5 text-[0.7rem] font-semibold text-white dark:bg-white dark:text-deep-700">
                                {t.pending}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accesos y directorio */}
                <div className="space-y-4">
                  <div className="rounded-2xl bg-surface-soft p-4 ring-1 ring-line">
                    <p className="text-sm font-bold text-heading">{t.quick}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {t.quickLinks.map((q, i) => (
                        <span
                          key={q}
                          className={cn(
                            "truncate rounded-xl px-3 py-2 text-xs font-semibold",
                            i === 0 ? "bg-action text-deep-700" : "bg-card text-heading ring-1 ring-line",
                          )}
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-surface-soft p-4 ring-1 ring-line">
                    <p className="text-sm font-bold text-heading">{t.directory}</p>
                    <ul className="mt-3 space-y-2.5">
                      {t.teams.map((p, i) => (
                        <li key={p.name} className={cn("flex items-center gap-3", i === 3 && "hidden sm:flex")}>
                          <span
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold",
                              i % 2 === 0 ? "bg-deep-700 text-white" : "bg-accent-soft text-accent",
                            )}
                          >
                            {initials(p.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-heading">{p.name}</span>
                            <span className="block truncate text-xs text-muted">{p.role}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Tipo de vista previa de cada módulo, en el orden de `modules`. */
const kinds = ["feed", "library", "people", "requests", "calendar", "survey"] as const;

function Showcase({ product, locale, tone }: ProductSignatureProps & { tone: Tone }) {
  const c = product[locale];
  const t = copy[locale];
  // Cada módulo real se acompaña del beneficio que más le corresponde.
  const benefitFor = [0, 0, 2, 1, 1, 2];
  const modules = c.modules.slice(0, kinds.length).map((name, i) => ({
    name,
    kind: kinds[i],
    note: c.benefits[benefitFor[i]]?.description ?? "",
  }));

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} size="lg" />
        <div className="mt-12 sm:mt-14">
          <IntranetLauncher modules={modules} groupLabel={t.groupLabel} previewLabel={t.previewLabel} />
        </div>
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
