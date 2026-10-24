import { Container } from "@/components/ui/Container";
import { serviceStack } from "@/content/serviceExtras";
import { servicePlans } from "@/content/pricing";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Integraciones & APIs — "Documentación de tu integración". Una página de
 * documentación de API (barra lateral con endpoints genéricos y área de
 * contenido) y los entregables reales como secciones de esa documentación.
 */

const copy = {
  es: {
    eyebrow: "Documentación de tu integración",
    subtitle:
      "Tu integración no es una caja negra. Queda documentada como cualquier API seria: qué conecta, cómo se llama y qué hacer cuando algo falla.",
    docs: "docs",
    guide: "Guía",
    reference: "Referencia",
    resource: "/recurso",
    params: "Parámetros",
    sections: "Secciones de la documentación",
    built: "Construida con",
  },
  en: {
    eyebrow: "Your integration's documentation",
    subtitle:
      "Your integration isn't a black box. It's documented like any serious API: what it connects, how to call it and what to do when something fails.",
    docs: "docs",
    guide: "Guide",
    reference: "Reference",
    resource: "/resource",
    params: "Parameters",
    sections: "Documentation sections",
    built: "Built with",
  },
};

const methods = ["GET", "POST", "PUT", "DELETE"] as const;

/** Página de documentación ilustrativa (navegación con los entregables). */
function DocsMock({ t, nav }: { t: (typeof copy)["es"]; nav: string[] }) {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-line"
    >
      <div className="flex items-center gap-1.5 border-b border-line bg-surface-soft px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-deep-200 dark:bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-deep-200 dark:bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-deep-200 dark:bg-white/20" />
        <span className="ml-3 rounded-full bg-card px-3 py-0.5 text-xs text-muted">
          api · {t.docs}
        </span>
      </div>
      <div className="grid sm:grid-cols-[13rem_1fr]">
        <nav className="hidden border-r border-line bg-surface-soft/60 p-5 text-[13px] sm:block">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t.guide}
          </p>
          <ul className="mt-3 space-y-2">
            {nav.map((item, i) => (
              <li
                key={item}
                className={cn(
                  "leading-snug",
                  i === 1 ? "font-semibold text-heading" : "text-muted",
                )}
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">
            {t.reference}
          </p>
          <ul className="mt-3 space-y-2 font-mono text-xs">
            {methods.map((m) => (
              <li key={m} className="flex items-center gap-2 text-muted">
                <span
                  className={cn(
                    "w-12 font-bold",
                    m === "GET" ? "text-accent" : "text-heading",
                  )}
                >
                  {m}
                </span>
                {t.resource}
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 p-6 sm:p-8">
          <span className="block h-2 w-24 rounded-full bg-deep-200 dark:bg-white/15" />
          <p className="mt-4 flex items-center gap-3 font-mono text-sm">
            <span className="rounded-md bg-action px-2 py-0.5 text-xs font-bold text-deep-700">
              GET
            </span>
            <span className="text-heading">
              {t.resource}/{"{id}"}
            </span>
          </p>
          <div className="mt-5 space-y-2">
            <span className="block h-1.5 rounded-full bg-deep-100 dark:bg-white/10" />
            <span className="block h-1.5 w-5/6 rounded-full bg-deep-100 dark:bg-white/10" />
            <span className="block h-1.5 w-2/3 rounded-full bg-deep-100 dark:bg-white/10" />
          </div>
          <p className="mt-7 text-xs font-semibold text-heading">{t.params}</p>
          <div className="mt-2 divide-y divide-line rounded-xl ring-1 ring-line">
            {[0, 1, 2].map((r) => (
              <div key={r} className="flex items-center gap-4 px-4 py-2.5">
                <span className="h-1.5 w-14 rounded-full bg-deep-200 dark:bg-white/20" />
                <span className="h-1.5 w-10 rounded-full bg-accent/50" />
                <span className="h-1.5 flex-1 rounded-full bg-deep-100 dark:bg-white/10" />
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-deep-700 p-4 font-mono text-xs leading-6 text-white/70 dark:bg-deep-900">
            <p>{"{"}</p>
            <p className="pl-4">
              <span className="text-white">&quot;id&quot;</span>:{" "}
              <span className="text-brand-green">&quot;…&quot;</span>,
            </p>
            <p className="pl-4">
              <span className="text-white">&quot;status&quot;</span>:{" "}
              <span className="text-brand-green">&quot;…&quot;</span>
            </p>
            <p>{"}"}</p>
          </div>
        </div>
      </div>
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
  const plans = servicePlans[service.slug] ?? [];
  const f = (key: string) =>
    plans.find((p) => p.key === key)?.[locale].features ?? [];
  const single = f("puntual");
  const eco = f("paquete");
  const stack = (serviceStack[service.slug] ?? []).filter((s) =>
    ["REST", "GraphQL", "Webhooks", "OAuth 2.0"].includes(s),
  );

  // Qué documenta cada sección: funciones reales de los planes.
  const details = [
    c.features[1],
    eco[1],
    eco[2],
    [single[2], eco[3]].filter(Boolean).join(" · "),
  ];

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
            <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-heading sm:text-5xl">
              {title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              {t.subtitle}
            </p>

            <h3 className="mt-10 text-sm font-semibold text-muted">
              {t.sections}
            </h3>
            <ol className="mt-3 border-t border-line">
              {c.deliverables.map((item, i) => (
                <li key={item} className="flex gap-4 border-b border-line py-5">
                  <span className="w-8 shrink-0 pt-0.5 font-mono text-sm font-bold text-accent">
                    §{i + 1}
                  </span>
                  <div>
                    <p className="text-lg font-bold leading-snug text-heading">
                      {item}
                    </p>
                    {details[i] && (
                      <p className="mt-1 text-sm text-muted">{details[i]}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {stack.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm text-muted">{t.built}</span>
                {stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-3 py-1 font-mono text-xs font-semibold text-heading ring-1 ring-line-strong"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <DocsMock t={t} nav={c.deliverables} />
        </div>
      </Container>
    </section>
  );
};
