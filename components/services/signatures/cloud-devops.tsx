import {
  Activity,
  Boxes,
  CheckCircle2,
  Database,
  GitCommitHorizontal,
  Globe2,
  Hammer,
  Network,
  Rocket,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getSla } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type {
  ServiceSignature,
  SignatureHeroProps,
  SignatureProps,
  Tone,
} from "./types";

/**
 * Cloud & DevOps — la cabecera es un diagrama de arquitectura (usuarios hasta
 * la base de datos, con monitoreo) sobre azul marino, con los compromisos de
 * servicio reales. La sección insignia es el pipeline de CI/CD.
 */
const copy = {
  es: {
    diagramLabel: "Arquitectura de referencia",
    nodes: {
      users: ["Usuarios", "Web y móvil"],
      cdn: ["CDN", "Contenido en caché"],
      lb: ["Balanceador", "Reparte la carga"],
      app: ["App", "Contenedores"],
      db: ["Base de datos", "Réplicas y copias"],
      mon: ["Monitoreo", "Métricas y alertas"],
    },
    eyebrow: "CI/CD",
    title: "Cada cambio llega a producción por el mismo camino",
    subtitle:
      "Un pipeline automatizado revisa, prueba y despliega tu código. Si algo falla, se detiene antes de llegar a tus usuarios.",
    stages: [
      {
        title: "Commit",
        text: "El equipo sube el cambio al repositorio y se dispara el pipeline.",
      },
      {
        title: "Build",
        text: "Se construye la imagen del contenedor, siempre igual y versionada.",
      },
      {
        title: "Pruebas",
        text: "Pruebas automáticas y revisiones de seguridad antes de avanzar.",
      },
      {
        title: "Despliegue",
        text: "Salida gradual a producción, con vuelta atrás si algo no cuadra.",
      },
      {
        title: "Monitoreo",
        text: "Métricas y alertas confirman que todo sigue sano después del cambio.",
      },
    ],
    passed: "Aprobado",
    platforms: "Plataformas y herramientas",
    deliverablesTitle: "Lo que te entregamos",
  },
  en: {
    diagramLabel: "Reference architecture",
    nodes: {
      users: ["Users", "Web and mobile"],
      cdn: ["CDN", "Cached content"],
      lb: ["Load balancer", "Spreads the load"],
      app: ["App", "Containers"],
      db: ["Database", "Replicas and backups"],
      mon: ["Monitoring", "Metrics and alerts"],
    },
    eyebrow: "CI/CD",
    title: "Every change reaches production the same way",
    subtitle:
      "An automated pipeline reviews, tests and deploys your code. If something fails, it stops before reaching your users.",
    stages: [
      {
        title: "Commit",
        text: "The team pushes the change to the repository and the pipeline kicks off.",
      },
      {
        title: "Build",
        text: "The container image is built, always the same and versioned.",
      },
      {
        title: "Tests",
        text: "Automated tests and security checks before moving on.",
      },
      {
        title: "Deploy",
        text: "Gradual rollout to production, with rollback if anything looks off.",
      },
      {
        title: "Monitoring",
        text: "Metrics and alerts confirm everything stays healthy after the change.",
      },
    ],
    passed: "Passed",
    platforms: "Platforms and tools",
    deliverablesTitle: "What we deliver",
  },
};

/** Tomadas de las características del servicio (AWS, GCP, Azure, Docker, Kubernetes). */
const platforms = ["AWS", "GCP", "Azure", "Docker", "Kubernetes"];

const stageIcons: LucideIcon[] = [
  GitCommitHorizontal,
  Hammer,
  ShieldCheck,
  Rocket,
  Activity,
];

/** Animación de los trazos punteados (solo si el usuario acepta movimiento). */
const flowCss = `
@keyframes sigCloudFlow { to { stroke-dashoffset: -28; } }
@media (prefers-reduced-motion: no-preference) {
  .sig-cloud-flow { animation: sigCloudFlow 1.4s linear infinite; }
}`;

type NodeKey = keyof (typeof copy)["es"]["nodes"];
type Box = { key: NodeKey; x: number; y: number; w: number; h: number };

const nodeIcons: Record<NodeKey, LucideIcon> = {
  users: Users,
  cdn: Globe2,
  lb: Network,
  app: Boxes,
  db: Database,
  mon: Activity,
};

function DiagramNode({
  box,
  label,
  sub,
}: {
  box: Box;
  label: string;
  sub: string;
}) {
  const Icon = nodeIcons[box.key];
  const isApp = box.key === "app";
  return (
    <g>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={22}
        className={cn(
          "fill-deep-800",
          isApp ? "stroke-brand-green" : "stroke-white/15",
        )}
        strokeWidth={isApp ? 2 : 1}
      />
      <Icon
        x={box.x + 18}
        y={box.y + 18}
        width={22}
        height={22}
        className="text-brand-green"
      />
      <text
        x={box.x + 18}
        y={box.y + 62}
        className="fill-white text-[17px] font-bold"
      >
        {label}
      </text>
      <text
        x={box.x + 18}
        y={box.y + 84}
        className="fill-white/60 text-[13px]"
      >
        {sub}
      </text>
      {isApp &&
        [0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={box.x + 18 + i * ((box.w - 36 - 16) / 3 + 8)}
              y={box.y + 100}
              width={(box.w - 36 - 16) / 3}
              height={box.h - 118}
              rx={10}
              className="fill-deep-700 stroke-white/10"
            />
            <circle
              cx={box.x + 30 + i * ((box.w - 36 - 16) / 3 + 8)}
              cy={box.y + 112}
              r={4}
              className="fill-brand-green"
            />
          </g>
        ))}
    </g>
  );
}

const edgeClass = "sig-cloud-flow stroke-brand-green";

function Diagram({
  locale,
  layout,
}: {
  locale: SignatureProps["locale"];
  layout: "wide" | "tall";
}) {
  const n = copy[locale].nodes;
  const wide = layout === "wide";

  const boxes: Box[] = wide
    ? [
        { key: "users", x: 10, y: 120, w: 170, h: 100 },
        { key: "cdn", x: 230, y: 120, w: 170, h: 100 },
        { key: "lb", x: 450, y: 120, w: 180, h: 100 },
        { key: "app", x: 680, y: 85, w: 240, h: 170 },
        { key: "db", x: 1000, y: 30, w: 190, h: 100 },
        { key: "mon", x: 1000, y: 210, w: 190, h: 100 },
      ]
    : [
        { key: "users", x: 20, y: 10, w: 320, h: 100 },
        { key: "cdn", x: 20, y: 150, w: 320, h: 100 },
        { key: "lb", x: 20, y: 290, w: 320, h: 100 },
        { key: "app", x: 20, y: 430, w: 320, h: 170 },
        { key: "db", x: 20, y: 650, w: 150, h: 100 },
        { key: "mon", x: 190, y: 650, w: 150, h: 100 },
      ];

  const edges = wide
    ? [
        "M180 170 H230",
        "M400 170 H450",
        "M630 170 H680",
        "M920 150 C960 150 960 80 1000 80",
        "M920 190 C960 190 960 260 1000 260",
      ]
    : [
        "M180 110 V150",
        "M180 250 V290",
        "M180 390 V430",
        "M120 600 C120 625 95 625 95 650",
        "M240 600 C240 625 265 625 265 650",
      ];

  return (
    <svg
      viewBox={wide ? "0 0 1200 340" : "0 0 360 760"}
      className={cn(
        "h-auto w-full",
        wide ? "hidden md:block" : "mx-auto max-w-sm md:hidden",
      )}
      aria-hidden
    >
      {edges.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          strokeWidth={2.5}
          strokeDasharray="6 8"
          strokeLinecap="round"
          className={edgeClass}
        />
      ))}
      {boxes.map((box) => {
        const [label, sub] = n[box.key];
        // En la versión vertical las cajas pequeñas no caben con subtítulo largo.
        const short = !wide && (box.key === "db" || box.key === "mon");
        return (
          <DiagramNode
            key={box.key}
            box={box}
            label={label}
            sub={short ? "" : sub}
          />
        );
      })}
    </svg>
  );
}

function Hero(props: SignatureHeroProps) {
  const { service, locale } = props;
  const c = service[locale];
  const t = copy[locale];
  const sla = getSla(service.slug, locale);

  return (
    <section className="relative overflow-hidden bg-deep-950 pb-16 pt-28 text-white sm:pb-24 sm:pt-32">
      <style>{flowCss}</style>
      <Container>
        <HeroBreadcrumb
          backLabel={props.backLabel}
          backHref={props.backHref}
          dark
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-brand-green">
              {c.tagline}
            </p>
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
              {c.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
              {c.intro}
            </p>
            <HeroActions
              primary={props.primary}
              secondary={props.secondary}
              dark
              className="mt-8"
            />
          </div>

          {sla.length > 0 && (
            <dl className="grid grid-cols-2 gap-3">
              {sla.map((row) => (
                <div
                  key={row.label}
                  className="rounded-3xl bg-white/5 px-5 py-4 ring-1 ring-white/10"
                >
                  <dd className="text-2xl font-bold text-brand-green sm:text-3xl">
                    {row.value}
                  </dd>
                  <dt className="mt-1 text-sm leading-snug text-white/70">
                    {row.label}
                  </dt>
                </div>
              ))}
            </dl>
          )}
        </div>

        <figure className="mt-14 rounded-3xl bg-deep-900 p-4 ring-1 ring-white/10 sm:p-8">
          <figcaption className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
            <span className="h-2 w-2 rounded-full bg-brand-green" aria-hidden />
            {t.diagramLabel}
          </figcaption>
          <Diagram locale={locale} layout="wide" />
          <Diagram locale={locale} layout="tall" />
        </figure>
      </Container>
    </section>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const t = copy[locale];
  const c = service[locale];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  return (
    <section className={cn("isolate py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {t.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {t.subtitle}
          </p>
        </div>

        <ol className="mt-12 grid gap-4 lg:grid-cols-5 lg:gap-6">
          {t.stages.map((stage, i) => {
            const Icon = stageIcons[i];
            const last = i === t.stages.length - 1;
            return (
              <li key={stage.title} className="relative flex">
                <div
                  className={cn(
                    "flex w-full flex-col rounded-3xl p-6",
                    card,
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-deep-700 text-brand-green">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      {t.passed}
                    </span>
                  </div>
                  <p className="mt-5 text-xs font-semibold text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-heading">
                    {stage.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {stage.text}
                  </p>
                </div>
                {!last && (
                  <span
                    aria-hidden
                    className="absolute -right-6 top-1/2 hidden h-0.5 w-6 -translate-y-1/2 bg-line-strong lg:block"
                  />
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className={cn("rounded-3xl p-6 sm:p-8", card)}>
            <h3 className="text-lg font-bold text-heading">{t.platforms}</h3>
            <ul className="mt-5 flex flex-wrap gap-2">
              {platforms.map((p) => (
                <li
                  key={p}
                  className="rounded-full bg-surface px-4 py-2 text-sm font-semibold text-heading ring-1 ring-line"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className={cn("rounded-3xl p-6 sm:p-8", card)}>
            <h3 className="text-lg font-bold text-heading">
              {t.deliverablesTitle}
            </h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {c.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-body">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden
                  />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = {
  Hero,
  Showcase,
  // Los compromisos de servicio ya están en la cabecera / sección insignia.
  replaces: ["extra"],
};
