import { Check, Download, FileText, UserRoundCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HeroActions, HeroBreadcrumb, toneClass } from "@/components/services/signatures/shared";
import { cn } from "@/lib/utils";
import type { ProductHeroProps, ProductSignature, ProductSignatureProps, Tone } from "./types";

/**
 * Talento Humano & Nómina: la metáfora es el expediente y el desprendible.
 * La cabecera parte la pantalla: texto a la izquierda y, a la derecha, la
 * ficha del empleado con el desprendible de nómina superpuesto (sin cifras:
 * los valores se muestran como "$ —"). La sección insignia recorre el ciclo
 * de vida del empleado en un stepper horizontal.
 */

const copy = {
  es: {
    employee: "Colaborador",
    role: "Cargo · Área",
    contract: "Contrato a término indefinido",
    tabs: ["Expediente", "Ausencias", "Nómina"],
    docs: [
      { name: "Contrato y otrosí", state: "Vigente" },
      { name: "Examen médico", state: "Por vencer" },
    ],
    slip: "Desprendible de nómina",
    period: "Periodo de pago",
    earnings: "Devengados",
    earningItems: ["Salario básico", "Auxilio de transporte", "Horas extra"],
    deductions: "Deducciones",
    deductionItems: ["Salud", "Pensión"],
    net: "Neto a pagar",
    download: "Descargar PDF",
    eyebrow: "Ciclo de vida del empleado",
    title: "De la contratación al pago, en un solo recorrido",
    subtitle:
      "Cada etapa vive en la misma plataforma, así la información de una persona nunca se vuelve a digitar.",
    stages: ["Ingreso", "Nómina", "Vacaciones y permisos", "Evaluación"],
    always: "En todas las etapas",
  },
  en: {
    employee: "Employee",
    role: "Position · Department",
    contract: "Indefinite-term contract",
    tabs: ["Record", "Absences", "Payroll"],
    docs: [
      { name: "Contract and amendments", state: "Current" },
      { name: "Medical exam", state: "Expiring" },
    ],
    slip: "Payslip",
    period: "Pay period",
    earnings: "Earnings",
    earningItems: ["Base salary", "Transport allowance", "Overtime"],
    deductions: "Deductions",
    deductionItems: ["Health", "Pension"],
    net: "Net pay",
    download: "Download PDF",
    eyebrow: "Employee lifecycle",
    title: "From hiring to payday, in one journey",
    subtitle:
      "Every stage lives on the same platform, so a person's information never has to be typed in twice.",
    stages: ["Onboarding", "Payroll", "Vacations and leave", "Performance"],
    always: "Across every stage",
  },
};

function Hero({ product, locale, backLabel, backHref, categoryLabel, primary, secondary }: ProductHeroProps) {
  const c = product[locale];
  const t = copy[locale];

  return (
    <section className="overflow-hidden bg-surface pb-20 pt-28 sm:pb-28 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} />
        <div className="mt-8 grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            {categoryLabel && <p className="text-sm font-semibold text-accent">{categoryLabel}</p>}
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
              {c.title}
            </h1>
            <p className="mt-5 text-xl font-medium text-heading">{c.tagline}</p>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-body">{c.description}</p>
            <ul className="mt-7 grid max-w-xl gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {c.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-body">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <HeroActions primary={primary} secondary={secondary} className="mt-9" />
          </div>

          {/* Ficha del empleado + desprendible (ilustrativo, sin valores reales). */}
          <div aria-hidden className="relative mx-auto w-full max-w-xl">
            {/* Ficha */}
            <div className="rounded-3xl bg-surface-soft p-5 pb-20 ring-1 ring-line sm:w-[82%] sm:p-6 sm:pb-20">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-deep-700 text-lg font-bold text-brand-green">
                  CO
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-heading">{t.employee}</p>
                  <p className="text-sm text-muted">{t.role}</p>
                </div>
                <UserRoundCheck className="ml-auto h-5 w-5 shrink-0 text-accent" />
              </div>
              <p className="mt-4 inline-flex rounded-full bg-card px-3 py-1 text-xs font-semibold text-heading ring-1 ring-line">
                {t.contract}
              </p>
              <div className="mt-5 flex gap-1 rounded-full bg-card p-1 ring-1 ring-line">
                {t.tabs.map((tab, i) => (
                  <span
                    key={tab}
                    className={cn(
                      "flex-1 truncate rounded-full px-2 py-1.5 text-center text-xs font-semibold",
                      i === 0 ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "text-muted",
                    )}
                  >
                    {tab}
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-2">
                {t.docs.map((d, i) => (
                  <li key={d.name} className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5 ring-1 ring-line">
                    <FileText className="h-4 w-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-heading">{d.name}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold",
                        i === 0 ? "bg-accent-soft text-accent" : "bg-deep-700 text-white dark:bg-white dark:text-deep-700",
                      )}
                    >
                      {d.state}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Desprendible */}
            <div className="relative -mt-14 ml-auto w-[92%] rounded-3xl bg-deep-800 p-5 text-white shadow-card-hover ring-1 ring-white/10 sm:w-[72%] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{t.slip}</p>
                  <p className="mt-0.5 text-xs text-white/60">{t.period}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-action px-3 py-1 text-[0.7rem] font-semibold text-deep-700">
                  <Download className="h-3.5 w-3.5" />
                  {t.download}
                </span>
              </div>
              <SlipGroup title={t.earnings} items={t.earningItems} />
              <SlipGroup title={t.deductions} items={t.deductionItems} />
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-sm font-semibold">{t.net}</span>
                <span className="font-mono text-base font-bold text-brand-green">$ —</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function SlipGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <p className="text-[0.7rem] font-semibold text-white/50">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-white/85">{item}</span>
            <span className="font-mono text-white/60">$ —</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Showcase({ product, locale, tone }: ProductSignatureProps & { tone: Tone }) {
  const c = product[locale];
  const t = copy[locale];
  const m = c.modules;
  // Funciones reales de cada etapa (módulos y características del producto).
  const stages = [
    { name: t.stages[0], items: [m[4], m[0]] },
    { name: t.stages[1], items: [m[2], c.faqs[2]?.a], note: c.benefits[0]?.description },
    { name: t.stages[2], items: [m[1]] },
    { name: t.stages[3], items: [m[5]], note: c.benefits[2]?.description },
  ];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} size="lg" align="left" />

        <ol className="relative mt-12 grid gap-4 sm:mt-16 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {/* Línea del recorrido (solo en una fila). */}
          <span aria-hidden className="absolute left-6 right-6 top-6 hidden h-0.5 bg-line-strong xl:block" />
          {stages.map((s, i) => (
            <li key={s.name} className="relative flex flex-col">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full text-base font-bold ring-4",
                    i === 1 ? "bg-action text-deep-700" : "bg-deep-700 text-white dark:bg-white dark:text-deep-700",
                    tone === "muted" ? "ring-surface-soft" : "ring-surface",
                  )}
                >
                  {i + 1}
                </span>
                <span aria-hidden className="h-0.5 flex-1 bg-line-strong xl:hidden" />
              </div>
              <div className={cn("mt-5 flex flex-1 flex-col rounded-3xl p-6 ring-1 ring-line", card)}>
                <h3 className="text-xl font-bold text-heading">{s.name}</h3>
                <ul className="mt-4 space-y-3">
                  {s.items.filter((x): x is string => Boolean(x)).map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-body">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                {s.note && (
                  <div className="mt-auto pt-6">
                    <p className="border-t border-line pt-4 text-sm leading-relaxed text-muted">{s.note}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        {/* El portal de autogestión acompaña todo el recorrido. */}
        <div className="mt-5 flex flex-col gap-4 rounded-3xl bg-deep-800 p-6 text-white sm:flex-row sm:items-center sm:gap-8 sm:p-8">
          <div className="sm:w-1/3">
            <p className="text-sm font-semibold text-brand-green">{t.always}</p>
            <p className="mt-1 text-xl font-bold">{c.features[3]}</p>
          </div>
          <p className="leading-relaxed text-white/80 sm:flex-1">
            {m[3]}. {c.benefits[1]?.description}
          </p>
        </div>
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
