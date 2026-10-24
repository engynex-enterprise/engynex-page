import { FileText } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getServiceProcess } from "@/content/serviceProcess";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * UX/UI & Branding — "Archivos que te llevas": cada entregable es una
 * miniatura de archivo de diseño con su propia proporción (mapa de
 * información, hoja de marca, pantallas del prototipo, componentes),
 * dispuestas en un tablero tipo mosaico.
 */
const copy = {
  es: {
    lead: "Archivos que te llevas",
    subtitle:
      "Al final del proyecto la marca y la interfaz son tuyas: te entregamos los archivos fuente organizados, listos para que tu equipo o cualquier proveedor siga construyendo.",
    kinds: ["Documento", "Manual", "Prototipo", "Librería"],
    handover: "Entrega final",
  },
  en: {
    lead: "Files you take home",
    subtitle:
      "When the project ends, the brand and the interface are yours: we hand over the organized source files, ready for your team or any vendor to keep building.",
    kinds: ["Document", "Guidelines", "Prototype", "Library"],
    handover: "Final handover",
  },
};

/* Miniaturas ilustrativas (aria-hidden), una por tipo de archivo. */

function SitemapThumb() {
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-5 bg-surface p-6">
      <span className="h-7 w-24 rounded-lg bg-deep-700 dark:bg-deep-200" />
      <span className="h-4 w-px bg-line-strong" />
      <div className="relative flex w-full justify-between gap-3 before:absolute before:inset-x-[12%] before:-top-5 before:h-px before:bg-line-strong">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <span className="h-6 w-full max-w-20 rounded-lg bg-accent-soft ring-1 ring-line" />
            <span className="h-3 w-4/5 max-w-16 rounded-md bg-line" />
            <span className="h-3 w-4/5 max-w-16 rounded-md bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandSheetThumb() {
  return (
    <div className="flex aspect-[3/4] flex-col gap-5 bg-surface p-6">
      <div className="flex flex-1 items-center justify-center rounded-2xl bg-deep-700">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-action">
          <span className="h-5 w-5 rounded-sm bg-deep-700" />
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <span className="aspect-square rounded-lg bg-deep-700" />
        <span className="aspect-square rounded-lg bg-action" />
        <span className="aspect-square rounded-lg bg-deep-200" />
        <span className="aspect-square rounded-lg bg-deep-100 ring-1 ring-line" />
      </div>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold leading-none text-heading">Aa</span>
        <span className="mb-1 flex-1 space-y-1.5">
          <span className="block h-1.5 w-full rounded-full bg-line-strong" />
          <span className="block h-1.5 w-2/3 rounded-full bg-line" />
        </span>
      </div>
    </div>
  );
}

function PrototypeThumb() {
  return (
    <div className="flex aspect-[16/10] items-center justify-center gap-4 bg-deep-900 p-6 sm:gap-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4 sm:gap-6">
          <div className="flex h-28 w-14 flex-col gap-1.5 rounded-xl bg-white p-1.5 sm:h-36 sm:w-18">
            <span className="h-8 rounded-md bg-deep-200 sm:h-10" />
            <span className="h-1.5 w-4/5 rounded-full bg-deep-200" />
            <span className="h-1.5 w-3/5 rounded-full bg-deep-100" />
            <span className="mt-auto h-3 rounded-full bg-action" />
          </div>
          {i < 2 && <span className="h-px w-4 bg-brand-green sm:w-6" />}
        </div>
      ))}
    </div>
  );
}

function ComponentsThumb() {
  return (
    <div className="grid aspect-square grid-cols-2 gap-3 bg-surface p-6">
      <div className="flex flex-col justify-center gap-2 rounded-2xl bg-surface-soft p-3">
        <span className="h-6 rounded-full bg-action" />
        <span className="h-6 rounded-full bg-deep-700 dark:bg-deep-200" />
        <span className="h-6 rounded-full ring-1 ring-line-strong" />
      </div>
      <div className="flex flex-col justify-center gap-2 rounded-2xl bg-surface-soft p-3">
        <span className="h-6 rounded-lg bg-surface ring-1 ring-line-strong" />
        <span className="h-6 rounded-lg bg-surface ring-1 ring-line-strong" />
      </div>
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-surface-soft p-3">
        <span className="flex h-5 w-9 items-center justify-end rounded-full bg-deep-700 p-0.5 dark:bg-action">
          <span className="h-4 w-4 rounded-full bg-white" />
        </span>
        <span className="flex h-5 w-9 items-center rounded-full bg-line-strong p-0.5">
          <span className="h-4 w-4 rounded-full bg-white" />
        </span>
      </div>
      <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-surface-soft p-3">
        <span className="h-5 w-5 rounded-md bg-deep-700 dark:bg-deep-200" />
        <span className="h-5 w-5 rounded-md ring-1 ring-line-strong" />
        <span className="h-5 w-5 rounded-full bg-action" />
      </div>
    </div>
  );
}

const thumbs = [SitemapThumb, BrandSheetThumb, PrototypeThumb, ComponentsThumb];

export const deliverables: DeliverablesDesign = ({
  service,
  locale,
  tone,
  title,
}) => {
  const c = service[locale];
  const t = copy[locale];
  const lastStep = getServiceProcess(service.slug)?.[locale].steps.at(-1);
  const board =
    tone === "muted" ? "bg-card ring-1 ring-line" : "bg-surface-soft";

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
              {title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              <strong className="font-bold text-heading">{t.lead}.</strong>{" "}
              {t.subtitle}
            </p>
            {lastStep && (
              <p className="mt-8 border-t border-line pt-5 text-sm text-muted">
                <span className="font-semibold text-heading">
                  {t.handover}:
                </span>{" "}
                {lastStep.title} · {lastStep.meta}
              </p>
            )}
          </div>

          {/* Tablero de archivos en mosaico. */}
          <ul
            className={cn(
              "columns-1 gap-4 rounded-3xl p-4 sm:columns-2 sm:p-6",
              board,
            )}
          >
            {c.deliverables.map((item, i) => {
              const Thumb = thumbs[i % thumbs.length];
              return (
                <li
                  key={item}
                  className="mb-4 break-inside-avoid overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-line last:mb-0"
                >
                  <div
                    aria-hidden
                    className="overflow-hidden border-b border-line"
                  >
                    <Thumb />
                  </div>
                  <div className="flex items-start gap-3 p-4 sm:p-5">
                    <FileText
                      aria-hidden
                      className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {t.kinds[i % t.kinds.length]}
                      </p>
                      <p className="mt-1 text-base font-bold leading-snug text-heading">
                        {item}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
};
