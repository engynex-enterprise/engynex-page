import { Container } from "@/components/ui/Container";
import { serviceStack } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import { PlatformModules } from "./parts/plataformas-web-modules";
import type { ServiceSignature, SignatureHeroProps, SignatureProps, Tone } from "./types";

/**
 * Plataformas web: cabecera marino a todo el ancho con un panel
 * administrativo bajo el titular (los módulos del menú lateral son las
 * características reales) y una sección insignia con pestañas que muestran
 * cada módulo.
 */
const copy = {
  es: {
    search: "Buscar…",
    filters: ["Todos", "Activos", "Pendientes"],
    tableHead: ["Registro", "Responsable", "Estado"],
    status: ["Activo", "En revisión", "Activo", "Pendiente", "Activo"],
    showcaseTitle: "Módulos a la medida",
    showcaseSubtitle:
      "Cada plataforma se arma con los módulos que tu operación necesita. Explora cómo se ve cada uno.",
    tabsLabel: "Módulos de la plataforma",
    moduleText: [
      "Una aplicación web construida alrededor de tu proceso: usuarios, roles y flujos propios, sin adaptarte a un software genérico.",
      "Paneles con los indicadores de tu operación en un solo lugar, con filtros y reportes para decidir con datos.",
      "Conectamos la plataforma con tu ERP, tu CRM y tus pasarelas de pago para que la información fluya sin digitarla dos veces.",
      "Infraestructura en la nube preparada para crecer con tus usuarios, con despliegues automatizados y ambientes separados.",
    ],
    integrations: { hub: "Tu plataforma", nodes: ["ERP", "CRM", "Pagos"] },
    layers: ["Interfaz", "API", "Datos", "Nube"],
  },
  en: {
    search: "Search…",
    filters: ["All", "Active", "Pending"],
    tableHead: ["Record", "Owner", "Status"],
    status: ["Active", "In review", "Active", "Pending", "Active"],
    showcaseTitle: "Modules built for you",
    showcaseSubtitle:
      "Every platform is assembled from the modules your operation needs. Explore what each one looks like.",
    tabsLabel: "Platform modules",
    moduleText: [
      "A web application built around your process: your own users, roles and workflows, instead of bending to generic software.",
      "Dashboards with your operation's indicators in one place, with filters and reports to decide with data.",
      "We connect the platform with your ERP, CRM and payment gateways so information flows without being typed twice.",
      "Cloud infrastructure ready to grow with your users, with automated deployments and separate environments.",
    ],
    integrations: { hub: "Your platform", nodes: ["ERP", "CRM", "Payments"] },
    layers: ["Interface", "API", "Data", "Cloud"],
  },
};

/** Tecnologías del stack (content/serviceExtras) que van en cada capa. */
const layerTech = [
  ["React", "TypeScript"],
  ["Node.js"],
  ["PostgreSQL", "Redis"],
  ["Docker", "AWS", "GitHub Actions"],
];

/** Ancho de las barras de texto de la tabla (varía por fila). */
const rowWidths = ["w-3/4", "w-1/2", "w-2/3", "w-3/5", "w-4/5"];

function Hero({ service, locale, ...props }: SignatureHeroProps) {
  const c = service[locale];
  const t = copy[locale];

  return (
    <section className="relative overflow-hidden bg-deep-900 pt-28 text-white sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} dark />

        <div className="mx-auto mt-8 max-w-4xl text-center">
          <p className="text-sm font-semibold text-brand-green">{c.tagline}</p>
          <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
            {c.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            {c.intro}
          </p>
          <HeroActions
            primary={props.primary}
            secondary={props.secondary}
            dark
            className="mt-9 justify-center"
          />
        </div>

        {/* Panel administrativo (ilustrativo), cortado por el borde inferior. */}
        <div aria-hidden className="relative mx-auto mt-14 max-w-6xl sm:mt-16">
          <div className="flex overflow-hidden rounded-t-3xl border border-b-0 border-white/10 bg-deep-800 shadow-[0_-30px_80px_-40px_rgba(0,0,0,0.6)]">
            {/* Menú lateral con los módulos */}
            <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-white/10 p-5 md:flex">
              <div className="mb-5 flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-action" />
                <span className="h-2.5 w-20 rounded-full bg-white/70" />
              </div>
              {c.features.map((feature, i) => (
                <span
                  key={feature}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.8rem] font-medium leading-tight",
                    i === 1 ? "bg-white/10 text-white" : "text-white/60",
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      i === 1 ? "bg-brand-green" : "bg-white/25",
                    )}
                  />
                  {feature}
                </span>
              ))}
            </aside>

            <div className="min-w-0 flex-1 p-4 sm:p-6">
              {/* Barra superior */}
              <div className="flex items-center gap-3">
                <span className="flex h-9 min-w-0 flex-1 items-center rounded-full bg-white/5 px-4 text-xs text-white/40 ring-1 ring-white/10 sm:max-w-xs">
                  {t.search}
                </span>
                <span className="ml-auto flex -space-x-2">
                  {["bg-deep-400", "bg-deep-500", "bg-brand-green"].map((bg) => (
                    <span
                      key={bg}
                      className={cn("h-8 w-8 rounded-full ring-2 ring-deep-800", bg)}
                    />
                  ))}
                </span>
              </div>

              {/* Tarjetas de indicadores (sin cifras) */}
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-2xl bg-white/5 p-4 ring-1 ring-white/10",
                      i === 2 && "hidden lg:block",
                    )}
                  >
                    <span className="block h-2 w-1/3 rounded-full bg-white/30" />
                    <span className="mt-3 block h-4 w-1/2 rounded-full bg-white/80" />
                    <svg viewBox="0 0 120 30" className="mt-3 h-8 w-full" preserveAspectRatio="none">
                      <polyline
                        points={
                          i === 1
                            ? "0,22 20,18 40,20 60,12 80,14 100,8 120,10"
                            : "0,26 20,20 40,22 60,16 80,10 100,12 120,4"
                        }
                        fill="none"
                        stroke={i === 0 ? "#9fdb4f" : "rgba(255,255,255,0.45)"}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                ))}
              </div>

              {/* Filtros + tabla */}
              <div className="mt-5 rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
                <div className="flex flex-wrap gap-2 border-b border-white/10 p-3 sm:p-4">
                  {t.filters.map((filter, i) => (
                    <span
                      key={filter}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        i === 0
                          ? "bg-action text-deep-700"
                          : "bg-white/5 text-white/70 ring-1 ring-white/10",
                      )}
                    >
                      {filter}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-[1.4fr_1fr_auto] gap-x-4 px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wide text-white/40">
                  {t.tableHead.map((h) => (
                    <span key={h}>{h}</span>
                  ))}
                </div>
                {t.status.map((status, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1.4fr_1fr_auto] items-center gap-x-4 border-t border-white/5 px-4 py-3"
                  >
                    <span className={cn("h-2 rounded-full bg-white/50", rowWidths[i])} />
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 shrink-0 rounded-full bg-deep-500" />
                      <span className="h-2 w-2/3 rounded-full bg-white/25" />
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold",
                        i === 0 || i === 2 || i === 4
                          ? "bg-brand-green/15 text-brand-green"
                          : "bg-white/10 text-white/70",
                      )}
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const c = service[locale];
  const t = copy[locale];
  const stack = serviceStack[service.slug] ?? [];

  return (
    <section className={cn("isolate py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {t.showcaseTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {t.showcaseSubtitle}
          </p>
        </div>

        <PlatformModules
          className="mt-12"
          tone={tone}
          label={t.tabsLabel}
          modules={c.features.map((title, i) => ({
            title,
            text: t.moduleText[i] ?? "",
          }))}
          integrations={t.integrations}
          layers={t.layers.map((name, i) => ({
            name,
            tech: layerTech[i].filter((tech) => stack.includes(tech)),
          }))}
        />
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
