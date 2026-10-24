import {
  CheckCircle2,
  FileCheck2,
  FilePen,
  FileSearch,
  History,
  PenLine,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import {
  HeroActions,
  HeroBreadcrumb,
  toneClass,
} from "@/components/services/signatures/shared";
import type {
  ProductHeroProps,
  ProductSignature,
  ProductSignatureProps,
  Tone,
} from "./types";

/**
 * Gestión Documental & Firma: la metáfora es el documento versionado. La
 * cabecera (imagen a la izquierda, texto a la derecha) apila las versiones
 * v1, v2 y v3 con la vigente al frente y su campo de firma; la sección
 * insignia recorre el flujo Borrador → Revisión → Aprobado → Firmado junto
 * al rastro de auditoría.
 */

const copy = {
  es: {
    doc: "Documento",
    current: "Vigente",
    versions: "Versiones",
    signature: "Firma",
    signed: "Firmado electrónicamente · sello de tiempo —",
    eyebrow: "Del borrador a la firma",
    title: "Cada paso aprobado, cada firma con evidencia",
    subtitle:
      "El documento avanza por un flujo que tú configuras y cada movimiento queda registrado: quién, cuándo y sobre qué versión.",
    stages: [
      { name: "Borrador", text: "El documento nace en el repositorio, con sus metadatos y solo visible para quien debe verlo." },
      { name: "Revisión", text: "Los revisores comentan y cada ajuste crea una versión nueva que se puede comparar con la anterior." },
      { name: "Aprobado", text: "La versión aprobada queda marcada como vigente; las anteriores se conservan como historial." },
      { name: "Firmado", text: "Los firmantes reciben el documento en orden y la firma cierra el flujo con su evidencia." },
    ],
    audit: "Rastro de auditoría",
    auditCols: ["Evento", "Usuario", "Sello de tiempo"],
    events: [
      { e: "Documento creado · v1", who: "Autor", s: 0 },
      { e: "Nueva versión · v2", who: "Autor", s: 0 },
      { e: "Enviado a revisión", who: "Autor", s: 1 },
      { e: "Comentario del revisor", who: "Revisor", s: 1 },
      { e: "Nueva versión · v3", who: "Autor", s: 1 },
      { e: "v3 aprobada y vigente", who: "Aprobador", s: 2 },
      { e: "Firma solicitada", who: "Sistema", s: 3 },
      { e: "Documento firmado", who: "Firmante", s: 3 },
    ],
    auditNote:
      "La plataforma guarda la trazabilidad completa de la firma: identidad, IP, sello de tiempo y documento firmado.",
  },
  en: {
    doc: "Document",
    current: "Current",
    versions: "Versions",
    signature: "Signature",
    signed: "Signed electronically · timestamp —",
    eyebrow: "From draft to signature",
    title: "Every step approved, every signature with evidence",
    subtitle:
      "The document moves through a workflow you configure and every action is recorded: who, when and on which version.",
    stages: [
      { name: "Draft", text: "The document is born in the repository, with its metadata and visible only to the people who should see it." },
      { name: "Review", text: "Reviewers comment and every change creates a new version you can compare with the previous one." },
      { name: "Approved", text: "The approved version is flagged as current; earlier ones are kept as history." },
      { name: "Signed", text: "Signers receive the document in order, and the signature closes the workflow with its evidence." },
    ],
    audit: "Audit trail",
    auditCols: ["Event", "User", "Timestamp"],
    events: [
      { e: "Document created · v1", who: "Author", s: 0 },
      { e: "New version · v2", who: "Author", s: 0 },
      { e: "Sent for review", who: "Author", s: 1 },
      { e: "Reviewer comment", who: "Reviewer", s: 1 },
      { e: "New version · v3", who: "Author", s: 1 },
      { e: "v3 approved and current", who: "Approver", s: 2 },
      { e: "Signature requested", who: "System", s: 3 },
      { e: "Document signed", who: "Signer", s: 3 },
    ],
    auditNote:
      "The platform stores the full signature trail: identity, IP, timestamp and signed document.",
  },
};

function Hero({
  product,
  locale,
  backLabel,
  backHref,
  categoryLabel,
  primary,
  secondary,
}: ProductHeroProps) {
  const c = product[locale];
  const t = copy[locale];

  return (
    <section className="bg-surface pb-20 pt-28 sm:pb-28 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} />
        <div className="mt-8 grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Versiones apiladas (ilustrativas). */}
          <div aria-hidden className="relative order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-3xl bg-deep-700 pb-0 pl-12 pr-6 pt-14 sm:px-14 sm:pt-16">
              <div className="relative mx-auto max-w-md">
                {/* v1 y v2 detrás. */}
                {[
                  { v: "v1", cls: "-rotate-[7deg] -translate-x-6 translate-y-6 bg-white/40" },
                  { v: "v2", cls: "-rotate-[3.5deg] -translate-x-3 translate-y-3 bg-white/70" },
                ].map((paper) => (
                  <div
                    key={paper.v}
                    className={cn("absolute inset-0 origin-bottom-left rounded-t-2xl", paper.cls)}
                  >
                    <span className="absolute -top-7 left-4 rounded-t-lg bg-white/25 px-3 py-1 font-mono text-xs font-semibold text-white">
                      {paper.v}
                    </span>
                  </div>
                ))}

                {/* v3 vigente al frente. */}
                <div className="relative rounded-t-2xl bg-white px-5 pb-8 pt-6 text-deep-700 shadow-card sm:px-7">
                  <span className="absolute -top-7 right-4 flex items-center gap-1.5 rounded-t-lg bg-action px-3 py-1 text-xs font-bold text-deep-700">
                    v3 · {t.current}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-deep-100">
                      <FileCheck2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-sm font-bold">{t.doc}</p>
                      <span className="block h-2 w-2/3 rounded-full bg-deep-200" />
                    </div>
                  </div>
                  <div className="mt-6 space-y-2.5">
                    {[100, 94, 98, 70, 0, 96, 88, 60].map((w, i) =>
                      w === 0 ? (
                        <span key={i} className="block h-2" />
                      ) : (
                        <span
                          key={i}
                          className="block h-2 rounded-full bg-deep-100"
                          style={{ width: `${w}%` }}
                        />
                      ),
                    )}
                  </div>

                  {/* Campo de firma. */}
                  <div className="mt-7 rounded-2xl border-2 border-dashed border-deep-200 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-deep-500">
                      <PenLine className="h-3.5 w-3.5" />
                      {t.signature}
                    </p>
                    <svg viewBox="0 0 220 56" className="mt-1 h-12 w-48 text-deep-700" fill="none">
                      <path
                        d="M6 40c14-22 22-30 28-24s-10 26-2 26 18-30 26-28-4 22 4 22 14-18 22-18 4 16 12 14 16-20 26-20 8 10 20 8 22-8 34-10"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-1 border-t border-deep-200 pt-2 text-[0.7rem] text-deep-500">
                      {t.signed}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Historial de versiones. */}
            <div className="relative -mt-6 ml-auto mr-4 w-56 rounded-3xl bg-card p-4 shadow-card-hover ring-1 ring-line sm:absolute sm:-bottom-8 sm:-right-4 sm:mr-0 sm:mt-0 sm:w-60">
              <p className="flex items-center gap-2 text-xs font-semibold text-muted">
                <History className="h-3.5 w-3.5" />
                {t.versions}
              </p>
              <ul className="mt-3 space-y-2">
                {["v3", "v2", "v1"].map((v, i) => (
                  <li key={v} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-mono font-semibold text-heading">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          i === 0 ? "bg-action" : "bg-line-strong",
                        )}
                      />
                      {v}
                    </span>
                    {i === 0 ? (
                      <span className="rounded-full bg-action px-2 py-0.5 text-[0.65rem] font-bold text-deep-700">
                        {t.current}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted">—</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            {categoryLabel && (
              <p className="text-sm font-semibold text-accent">{categoryLabel}</p>
            )}
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
              {c.title}
            </h1>
            <p className="mt-5 text-xl font-medium text-heading sm:text-2xl">{c.tagline}</p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-body">{c.description}</p>
            <HeroActions primary={primary} secondary={secondary} className="mt-8" />
          </div>
        </div>
      </Container>
    </section>
  );
}

const stageIcons = [FilePen, FileSearch, CheckCircle2, PenLine];

function Showcase({ product, locale, tone }: ProductSignatureProps & { tone: Tone }) {
  const c = product[locale];
  const t = copy[locale];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";
  // Funciones reales que resuelven cada etapa.
  const stageFeatures = [
    [c.modules[0], c.modules[1]],
    [c.modules[2], c.modules[3]],
    [c.features[1], c.benefits[0]?.title].filter(Boolean) as string[],
    [c.modules[4], c.modules[5]],
  ];

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-heading sm:text-5xl">
            {t.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-body">{t.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          {/* Flujo de aprobación. */}
          <ol className="relative">
            {t.stages.map((stage, i) => {
              const Icon = stageIcons[i];
              const last = i === t.stages.length - 1;
              return (
                <li key={stage.name} className="relative flex gap-5 pb-6 last:pb-0">
                  {!last && (
                    <span aria-hidden className="absolute bottom-0 left-6 top-12 w-0.5 -translate-x-1/2 bg-line-strong" />
                  )}
                  <span
                    className={cn(
                      "relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full",
                      last ? "bg-action text-deep-700" : "bg-deep-700 text-white dark:bg-card-soft",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className={cn("min-w-0 flex-1 rounded-3xl p-5 sm:p-6", card)}>
                    <h3 className="flex items-baseline gap-3 text-xl font-bold text-heading">
                      <span className="font-mono text-sm font-semibold text-muted">0{i + 1}</span>
                      {stage.name}
                    </h3>
                    <p className="mt-2 leading-relaxed text-body">{stage.text}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {stageFeatures[i].map((f) => (
                        <li
                          key={f}
                          className="rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-heading ring-1 ring-line dark:bg-surface-soft"
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Rastro de auditoría (ilustrativo). */}
          <figure className="lg:sticky lg:top-32 lg:self-start">
            <div aria-hidden className="rounded-3xl bg-deep-800 p-4 text-white ring-1 ring-white/10 sm:p-6">
              <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <History className="h-4 w-4 text-brand-green" />
                  {t.audit}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/70">
                  {t.doc} · v3
                </span>
              </div>
              <div className="mt-5 grid grid-cols-[1fr_4.5rem] gap-x-4 px-3 pb-2 sm:grid-cols-[1fr_6rem_7rem] text-[0.7rem] font-semibold uppercase tracking-wider text-white/50">
                <span>{t.auditCols[0]}</span>
                <span className="hidden sm:block">{t.auditCols[1]}</span>
                <span className="text-right">{t.auditCols[2]}</span>
              </div>
              <ol className="relative space-y-1">
                {t.events.map((ev, i) => (
                  <li
                    key={ev.e}
                    className={cn(
                      "grid grid-cols-[1fr_4.5rem] items-center gap-x-4 rounded-xl px-3 py-2.5 text-sm sm:grid-cols-[1fr_6rem_7rem]",
                      i === t.events.length - 1 ? "bg-white/[0.09] ring-1 ring-brand-green/50" : "bg-white/[0.04]",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          ev.s === 3 ? "bg-brand-green" : ev.s === 2 ? "bg-white" : "bg-white/35",
                        )}
                      />
                      <span className="truncate font-medium">{ev.e}</span>
                    </span>
                    <span className="hidden text-white/65 sm:block">{ev.who}</span>
                    <span className="text-right font-mono text-white/55">—</span>
                  </li>
                ))}
              </ol>
            </div>
            <figcaption className="mt-5 px-1">
              <p className="font-bold text-heading">{c.features[3]}</p>
              <p className="mt-1 text-body">{t.auditNote}</p>
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
