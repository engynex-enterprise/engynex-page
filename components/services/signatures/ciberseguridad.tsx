import { Container } from "@/components/ui/Container";
import { getSla } from "@/content/serviceExtras";
import { cn } from "@/lib/utils";
import { DefenseLayers } from "./parts/ciberseguridad-layers";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type {
  ServiceSignature,
  SignatureHeroProps,
  SignatureProps,
  Tone,
} from "./types";

/**
 * Ciberseguridad — la cabecera es una consola de seguridad: un panel tipo
 * terminal que recorre las revisiones del servicio con un escudo de marca.
 * La sección insignia explica la defensa en capas con anillos concéntricos.
 */
const copy = {
  es: {
    command: "engynex auditoria --alcance app,infra,datos",
    done: "OK",
    running: "EN CURSO",
    queued: "EN COLA",
    progress: "Progreso del análisis",
    note: "Hallazgos documentados con evidencia y prioridad",
    eyebrow: "Defensa en capas",
    title: "Un atacante busca la capa más débil. Nosotros revisamos todas",
    subtitle:
      "La seguridad no es un solo candado: protegemos a tu equipo, tu red, tus aplicaciones y, en el centro, tus datos.",
    groupLabel: "Capas de defensa",
    deliverableLabel: "Entregable:",
    howTitle: "Cómo trabajamos",
    layers: [
      {
        name: "Personas",
        text: "Revisamos accesos, permisos, contraseñas y prácticas del equipo: muchas brechas empiezan por una persona, no por el código.",
      },
      {
        name: "Red",
        text: "Simulamos ataques reales y controlados contra tu infraestructura expuesta para encontrar las puertas abiertas antes que un atacante.",
      },
      {
        name: "Aplicación",
        text: "Endurecemos configuraciones, dependencias y servidores, y priorizamos las correcciones según su impacto real.",
      },
      {
        name: "Datos",
        text: "Te acompañamos a proteger la información de tus clientes y a cumplir las normativas de protección de datos que aplican a tu negocio.",
      },
    ],
  },
  en: {
    command: "engynex audit --scope app,infra,data",
    done: "OK",
    running: "RUNNING",
    queued: "QUEUED",
    progress: "Scan progress",
    note: "Findings documented with evidence and priority",
    eyebrow: "Defense in depth",
    title: "An attacker looks for the weakest layer. We review them all",
    subtitle:
      "Security isn't a single lock: we protect your team, your network, your applications and, at the core, your data.",
    groupLabel: "Defense layers",
    deliverableLabel: "Deliverable:",
    howTitle: "How we work",
    layers: [
      {
        name: "People",
        text: "We review access, permissions, passwords and team practices: many breaches start with a person, not with code.",
      },
      {
        name: "Network",
        text: "We simulate real, controlled attacks against your exposed infrastructure to find open doors before an attacker does.",
      },
      {
        name: "Application",
        text: "We harden configurations, dependencies and servers, and prioritize fixes by their real impact.",
      },
      {
        name: "Data",
        text: "We help you protect your clients' information and comply with the data protection regulations that apply to your business.",
      },
    ],
  },
};

function ShieldEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 112" className={className} aria-hidden>
      <path
        d="M48 4 88 18v34c0 26-17 46-40 56C25 98 8 78 8 52V18L48 4Z"
        className="fill-deep-700 stroke-brand-green"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d="M48 16 77 26v26c0 19-12 34-29 42-17-8-29-23-29-42V26l29-10Z"
        className="fill-deep-800"
      />
      <path
        d="m33 56 10 10 21-22"
        fill="none"
        className="stroke-brand-green"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Console({
  locale,
  checks,
}: {
  locale: SignatureProps["locale"];
  checks: string[];
}) {
  const t = copy[locale];
  const statusFor = (i: number) =>
    i < 2
      ? { label: t.done, cls: "bg-brand-green/15 text-brand-green" }
      : i === 2
        ? { label: t.running, cls: "bg-white/10 text-white" }
        : { label: t.queued, cls: "text-white/50 ring-1 ring-white/15" };

  return (
    <div aria-hidden className="relative pt-10 sm:pt-12">
      <ShieldEmblem className="absolute right-4 top-0 z-10 h-24 w-20 sm:right-8 sm:h-28 sm:w-24" />
      <div className="overflow-hidden rounded-3xl bg-deep-900 ring-1 ring-white/10">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
          <span className="h-3 w-3 rounded-full bg-white/20" />
          <span className="h-3 w-3 rounded-full bg-white/20" />
          <span className="h-3 w-3 rounded-full bg-white/20" />
          <span className="ml-3 font-mono text-xs text-white/50">
            security-console
          </span>
        </div>
        <div className="space-y-4 p-5 font-mono text-[13px] sm:p-7 sm:text-sm">
          <p className="break-words text-white/85">
            <span className="text-brand-green">$</span> {t.command}
          </p>
          <ul className="space-y-3">
            {checks.map((check, i) => {
              const s = statusFor(i);
              return (
                <li
                  key={check}
                  className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0"
                >
                  <span
                    className={cn(
                      "min-w-0",
                      i > 2 ? "text-white/50" : "text-white/85",
                    )}
                  >
                    <span className="mr-2 text-white/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {check}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold",
                      s.cls,
                    )}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
          <div>
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>{t.progress}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-3/5 rounded-full bg-brand-green" />
            </div>
          </div>
          <p className="text-white/60">
            <span className="text-brand-green">›</span> {t.note}
            <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 bg-brand-green motion-safe:animate-pulse" />
          </p>
        </div>
      </div>
    </div>
  );
}

function Hero(props: SignatureHeroProps) {
  const { service, locale } = props;
  const c = service[locale];
  return (
    <section className="relative overflow-hidden bg-deep-950 pb-16 pt-28 text-white sm:pb-24 sm:pt-32">
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <HeroBreadcrumb
            backLabel={props.backLabel}
            backHref={props.backHref}
            dark
          />
          <p className="mt-8 text-sm font-semibold text-brand-green">
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
        <Console locale={locale} checks={c.features} />
      </Container>
    </section>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const t = copy[locale];
  const c = service[locale];
  const sla = getSla(service.slug, locale);
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  // Personas → auditoría, Red → pentesting, Aplicación → hardening,
  // Datos → cumplimiento: cada capa reutiliza una característica y un
  // entregable reales del servicio, en el mismo orden.
  const layers = t.layers.map((layer, i) => ({
    ...layer,
    feature: c.features[i] ?? layer.name,
    deliverable: c.deliverables[i] ?? "",
  }));

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

        <div className="mt-12">
          <DefenseLayers
            layers={layers}
            groupLabel={t.groupLabel}
            deliverableLabel={t.deliverableLabel}
          />
        </div>

        {sla.length > 0 && (
          <div className={cn("mt-14 rounded-3xl p-6 sm:p-8", card)}>
            <h3 className="text-lg font-bold text-heading">{t.howTitle}</h3>
            <dl className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {sla.map((row) => (
                <div key={row.label} className="border-l-2 border-accent pl-4">
                  <dt className="text-sm text-muted">{row.label}</dt>
                  <dd className="mt-1 text-xl font-bold text-heading">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
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
