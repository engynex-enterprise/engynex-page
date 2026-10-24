import {
  Activity,
  FileText,
  GitBranch,
  Network,
  PiggyBank,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getSla } from "@/content/serviceExtras";
import { servicePlans } from "@/content/pricing";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Cloud & DevOps — "Infraestructura documentada". Cada entregable es una
 * ficha del runbook que queda en manos del cliente (arquitectura, pipelines,
 * monitoreo, costos), junto a un árbol de repositorio ilustrativo.
 */

const copy = {
  es: {
    eyebrow: "Infraestructura documentada",
    subtitle:
      "Nada queda en la cabeza de una sola persona. Te entregamos la operación montada y por escrito, para que tu equipo la entienda, la opere y la herede.",
    tabs: ["Arquitectura", "Pipelines", "Monitoreo", "Costos"],
    repo: "repositorio",
    handover: "Al cierre",
    folders: ["arquitectura", "pipelines", "monitoreo", "costos"],
  },
  en: {
    eyebrow: "Documented infrastructure",
    subtitle:
      "Nothing lives in one person's head. We hand over the operation built and in writing, so your team can understand it, run it and inherit it.",
    tabs: ["Architecture", "Pipelines", "Monitoring", "Costs"],
    repo: "repository",
    handover: "At handover",
    folders: ["architecture", "pipelines", "monitoring", "costs"],
  },
};

const icons = [Network, GitBranch, Activity, PiggyBank];

/** Árbol de carpetas ilustrativo (los nombres son las secciones del runbook). */
function RepoTree({ name, folders }: { name: string; folders: string[] }) {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-3xl bg-deep-700 font-mono text-[13px] leading-7 text-white/80 dark:bg-card-soft"
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
        <span className="ml-3 text-xs text-white/50">{name}</span>
      </div>
      <div className="px-5 py-4">
        <p className="text-brand-green">infra/</p>
        {folders.map((f, i) => (
          <p key={f} className="flex items-center gap-2">
            <span className="text-white/35">
              {i === folders.length - 1 ? "└─" : "├─"}
            </span>
            <span>{f}/</span>
            <span className="ml-auto text-white/40">README.md</span>
          </p>
        ))}
        <p className="flex items-center gap-2">
          <span className="text-white/35">&nbsp;&nbsp;</span>
          <span className="text-white/40">README.md</span>
        </p>
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
  const setup = plans.find((p) => p.key === "setup")?.[locale].features ?? [];
  const ops = plans.find((p) => p.key === "gestion")?.[locale].features ?? [];
  const sla = getSla(service.slug, locale);
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  // Detalle de cada ficha: funciones reales de los planes y compromisos.
  const details: (string | undefined)[][] = [
    [setup[0], c.features[2]],
    [setup[2], ops[1]],
    [ops[0], ops[4]],
    [ops[2], sla[3] ? `${sla[3].label}: ${sla[3].value}` : undefined],
  ];

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div className="flex flex-col gap-10">
            <div>
              <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
              <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-heading sm:text-5xl">
                {title}
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
                {t.subtitle}
              </p>
            </div>
            <RepoTree name={t.repo} folders={t.folders} />
            {setup[4] && (
              <p className="flex items-center gap-3 text-sm text-body">
                <FileText
                  className="h-5 w-5 shrink-0 text-accent"
                  aria-hidden
                />
                <span>
                  <span className="font-semibold text-heading">
                    {t.handover}:
                  </span>{" "}
                  {setup[4]}
                </span>
              </p>
            )}
          </div>

          {/* Fichas del runbook: una pestaña por entregable. */}
          <ol className="grid gap-x-4 gap-y-8 pt-4 sm:grid-cols-2">
            {c.deliverables.map((item, i) => {
              const Icon = icons[i % icons.length];
              const dark = i === 0;
              return (
                <li key={item} className="relative flex flex-col">
                  <span
                    className={cn(
                      "absolute -top-4 left-6 rounded-t-xl px-4 pb-1 pt-1.5 text-xs font-semibold",
                      dark
                        ? "bg-deep-700 text-white dark:bg-card-soft"
                        : cn(card, "text-heading"),
                    )}
                  >
                    {String(i + 1).padStart(2, "0")} · {t.tabs[i] ?? ""}
                  </span>
                  <div
                    className={cn(
                      "flex flex-1 flex-col rounded-3xl p-7",
                      dark ? "bg-deep-700 text-white dark:bg-card-soft" : card,
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-11 w-11 place-items-center rounded-2xl",
                        dark
                          ? "bg-white/10 text-brand-green"
                          : "bg-deep-700 text-brand-green",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3
                      className={cn(
                        "mt-8 text-xl font-bold leading-snug",
                        !dark && "text-heading",
                      )}
                    >
                      {item}
                    </h3>
                    {/* Renglones de documento: lo que contiene la ficha. */}
                    <ul
                      className={cn(
                        "mt-5 space-y-2.5 border-t pt-5 text-sm",
                        dark
                          ? "border-white/15 text-white/80"
                          : "border-line text-muted",
                      )}
                    >
                      {details[i]?.filter(Boolean).map((d) => (
                        <li key={d} className="flex gap-3">
                          <span
                            className={cn(
                              "mt-2 h-px w-3 shrink-0",
                              dark ? "bg-brand-green" : "bg-heading/40",
                            )}
                            aria-hidden
                          />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
};
