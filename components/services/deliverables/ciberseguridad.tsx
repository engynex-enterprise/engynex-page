import { Lock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getSla } from "@/content/serviceExtras";
import { servicePlans } from "@/content/pricing";
import { cn } from "@/lib/utils";
import { toneClass } from "../signatures/shared";
import type { DeliverablesDesign } from "./types";

/**
 * Ciberseguridad — "Tu informe de seguridad". Un documento con portada y
 * tabla de hallazgos (severidades genéricas, sin conteos) y, al lado, los
 * entregables reales como capítulos del informe.
 */

const copy = {
  es: {
    eyebrow: "Tu informe de seguridad",
    subtitle:
      "Todo termina en un documento que entiendes y puedes presentar: qué encontramos, qué tan grave es y en qué orden corregirlo.",
    cover: "Informe de seguridad",
    confidential: "Confidencial",
    findings: "Hallazgos",
    cols: ["Hallazgo", "Severidad", "Estado"],
    severities: ["Crítica", "Alta", "Media", "Baja"],
    status: ["Corregido", "En curso", "Pendiente", "Pendiente"],
    chapter: "Capítulo",
    contents: "Contenido del informe",
  },
  en: {
    eyebrow: "Your security report",
    subtitle:
      "Everything ends in a document you understand and can present: what we found, how serious it is and in what order to fix it.",
    cover: "Security report",
    confidential: "Confidential",
    findings: "Findings",
    cols: ["Finding", "Severity", "Status"],
    severities: ["Critical", "High", "Medium", "Low"],
    status: ["Fixed", "In progress", "Open", "Open"],
    chapter: "Chapter",
    contents: "Report contents",
  },
};

/** Estilo de cada severidad: solo marino, verde de marca y neutros. */
const severityClass = [
  "bg-deep-700 text-white dark:bg-white dark:text-deep-700",
  "border border-deep-700 text-deep-700 dark:border-white dark:text-white",
  "bg-deep-100 text-deep-700 dark:bg-white/10 dark:text-white",
  "bg-accent-soft text-heading",
];

/** Documento ilustrativo: portada y tabla de hallazgos con barras de relleno. */
function ReportMock({ t, sla }: { t: (typeof copy)["es"]; sla?: string }) {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-xl">
      {/* Hojas de atrás, para dar volumen al documento. */}
      <div className="absolute inset-x-6 -bottom-3 top-6 rounded-3xl bg-deep-200/60 dark:bg-white/5" />
      <div className="relative overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-line">
        <div className="bg-deep-700 px-7 pb-8 pt-7 text-white sm:px-9 dark:bg-card-soft">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/60">
            <span>Engynex</span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-brand-green" />
              {t.confidential}
            </span>
          </div>
          <p className="mt-10 text-3xl font-bold tracking-tight">{t.cover}</p>
          <div className="mt-4 flex gap-2">
            <span className="h-2 w-28 rounded-full bg-white/25" />
            <span className="h-2 w-14 rounded-full bg-white/15" />
          </div>
          {sla && <p className="mt-6 text-xs text-white/60">{sla}</p>}
        </div>
        <div className="px-7 py-6 sm:px-9">
          <p className="text-sm font-bold text-heading">{t.findings}</p>
          <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-3 text-xs">
            {t.cols.map((col) => (
              <span key={col} className="font-semibold text-muted">
                {col}
              </span>
            ))}
            {t.severities.map((sev, i) => (
              <div key={sev} className="contents">
                <span className="flex items-center gap-2 border-t border-line pt-3">
                  <span className="text-muted">{`H-${String(i + 1).padStart(2, "0")}`}</span>
                  <span className="h-2 flex-1 rounded-full bg-deep-100 dark:bg-white/10" style={{ maxWidth: `${80 - i * 12}%` }} />
                </span>
                <span className="border-t border-line pt-3">
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 font-semibold", severityClass[i])}>
                    {sev}
                  </span>
                </span>
                <span className="border-t border-line pt-3 text-muted">{t.status[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const deliverables: DeliverablesDesign = ({ service, locale, tone, title }) => {
  const c = service[locale];
  const t = copy[locale];
  const plans = servicePlans[service.slug] ?? [];
  const f = (key: string) => plans.find((p) => p.key === key)?.[locale].features ?? [];
  const audit = f("auditoria");
  const pentest = f("pentesting");
  const program = f("programa");
  const sla = getSla(service.slug, locale);
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  // Lo que contiene cada capítulo, tomado de los planes y compromisos reales.
  const chapters: (string | undefined)[] = [
    [audit[2], audit[1]].filter(Boolean).join(" · "),
    [pentest[1], pentest[2]].filter(Boolean).join(" · "),
    [pentest[3], pentest[4]].filter(Boolean).join(" · "),
    [c.features[3], program[4]].filter(Boolean).join(" · "),
  ];

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">{t.subtitle}</p>
        </div>

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <ReportMock t={t} sla={sla[0] ? `${sla[0].label}: ${sla[0].value}` : undefined} />

          <div>
            <h3 className="text-sm font-semibold text-muted">{t.contents}</h3>
            <ol className="mt-4 border-t border-line">
              {c.deliverables.map((item, i) => (
                <li key={item} className="grid grid-cols-[auto_1fr] gap-x-5 border-b border-line py-6">
                  <span className="pt-1 text-xs font-semibold uppercase tracking-wider text-accent">
                    {t.chapter} {i + 1}
                  </span>
                  <div>
                    <p className="text-xl font-bold leading-snug text-heading">{item}</p>
                    {chapters[i] && <p className="mt-1.5 text-sm text-muted">{chapters[i]}</p>}
                  </div>
                </li>
              ))}
            </ol>

            {sla.length > 1 && (
              <dl className="mt-8 grid gap-px overflow-hidden rounded-3xl bg-line sm:grid-cols-3">
                {sla.slice(1).map((row) => (
                  <div key={row.label} className={cn("p-5", card)}>
                    <dt className="text-xs text-muted">{row.label}</dt>
                    <dd className="mt-1 font-bold text-heading">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
};
