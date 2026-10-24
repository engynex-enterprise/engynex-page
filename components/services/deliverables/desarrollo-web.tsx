import { Check, FileCode, Folder, FolderOpen } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { serviceStack } from "@/content/serviceExtras";
import { getServiceProcess } from "@/content/serviceProcess";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Desarrollo web — "El kit de entrega": a la izquierda, el árbol de carpetas
 * del proyecto (una carpeta por entregable real, ilustrativo); a la derecha,
 * la lista de lanzamiento con cada entregable marcado como listo.
 */
const copy = {
  es: {
    lead: "El kit de entrega",
    subtitle:
      "Al cierre del proyecto te entregamos todo ordenado: el diseño, el sitio publicado, la configuración de SEO y analítica, y el acompañamiento para que tu equipo lo administre.",
    root: "tumarca.com",
    checklist: "Lista de lanzamiento",
    ready: "Listo",
    launch: "Cierre del proyecto",
    stack: "Construido con",
  },
  en: {
    lead: "The handover kit",
    subtitle:
      "When the project wraps up we hand everything over, neatly organized: the design, the live site, the SEO and analytics setup, and the support your team needs to run it.",
    root: "yourbrand.com",
    checklist: "Launch checklist",
    ready: "Ready",
    launch: "Project close",
    stack: "Built with",
  },
};

/** Palabras que no aportan al nombre de carpeta. */
const stopwords = new Set([
  "y",
  "e",
  "a",
  "de",
  "del",
  "la",
  "el",
  "en",
  "and",
  "the",
  "of",
  "to",
]);

/** Nombre de carpeta derivado del entregable (sin tildes, en minúsculas). */
const folderName = (item: string) =>
  item
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => !stopwords.has(w))
    .slice(0, 2)
    .join("-");

export const deliverables: DeliverablesDesign = ({
  service,
  locale,
  tone,
  title,
}) => {
  const c = service[locale];
  const t = copy[locale];
  const stack = serviceStack[service.slug] ?? [];
  const lastStep = getServiceProcess(service.slug)?.[locale].steps.at(-1);
  const panel =
    tone === "muted" ? "bg-card ring-1 ring-line" : "bg-surface-soft";

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="max-w-3xl">
          <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            <strong className="font-bold text-heading">{t.lead}.</strong>{" "}
            {t.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:mt-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-6">
          {/* Árbol de carpetas del proyecto (ilustrativo). */}
          <div
            aria-hidden
            className="flex flex-col overflow-hidden rounded-3xl bg-deep-700 text-white"
          >
            <div className="flex items-center gap-1.5 border-b border-white/10 px-5 py-4">
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
            </div>
            <div className="flex-1 p-5 font-mono text-sm sm:p-7">
              <p className="flex items-center gap-2.5 font-semibold">
                <FolderOpen className="h-4 w-4 text-brand-green" />
                {t.root}/
              </p>
              <ul className="ml-2 mt-2 border-l border-white/15">
                {c.deliverables.map((item, i) => (
                  <li key={item} className="py-1.5 pl-4">
                    <span className="flex items-center gap-2.5">
                      <Folder className="h-4 w-4 shrink-0 text-brand-green" />
                      <span className="truncate">
                        {String(i + 1).padStart(2, "0")}-{folderName(item)}/
                      </span>
                    </span>
                    <span className="ml-1.5 mt-1 flex items-center gap-2 border-l border-white/15 py-1 pl-4 text-xs text-white/60">
                      <FileCode className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate font-sans">{item}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {stack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-white/10 px-5 py-4 sm:px-7">
                {stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Lista de lanzamiento: cada entregable, marcado. */}
          <div className={cn("flex flex-col rounded-3xl p-6 sm:p-8", panel)}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-heading">{t.checklist}</h3>
              <span className="rounded-full bg-action px-3 py-1 text-sm font-bold text-deep-700">
                {c.deliverables.length}/{c.deliverables.length}
              </span>
            </div>
            <ul className="mt-6 flex-1 divide-y divide-line">
              {c.deliverables.map((item) => (
                <li key={item} className="flex items-center gap-4 py-5">
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-deep-700 text-white dark:bg-action dark:text-deep-700"
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1 text-base font-bold leading-snug text-heading sm:text-lg">
                    {item}
                  </span>
                  <span className="hidden shrink-0 text-xs font-semibold uppercase tracking-wide text-accent sm:inline">
                    {t.ready}
                  </span>
                </li>
              ))}
            </ul>
            {lastStep && (
              <p className="mt-4 border-t border-line pt-5 text-sm text-muted">
                <span className="font-semibold text-heading">{t.launch}:</span>{" "}
                {lastStep.title} · {lastStep.meta}
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};
