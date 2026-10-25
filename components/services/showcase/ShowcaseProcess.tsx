import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Step = { title: string; description: string; meta: string };

/** Flecha horizontal: curva suave con trazo animado y punta vectorial. */
function ArrowRightVector({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 120 24" className="h-6 w-full" aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="1" stopColor="#9fdb4f" />
        </linearGradient>
      </defs>
      <path d="M2 12 C 40 2, 80 22, 110 12" fill="none" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="flow-dash" />
    </svg>
  );
}

/**
 * Proceso de la página insignia: nodos con icono unidos por flechas
 * vectoriales (horizontales en escritorio, verticales en celular), tarjeta
 * por etapa con duración y entregable, y un cierre con llamado a la acción.
 */
export function ShowcaseProcess({
  eyebrow,
  title,
  subtitle,
  steps,
  icons,
  stepLabel,
  ctaTitle,
  ctaLabel,
  ctaHref,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: Step[];
  icons: LucideIcon[];
  stepLabel: string;
  ctaTitle: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const cols = steps.length >= 5 ? "lg:grid-cols-5" : steps.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";

  return (
    <section id="proceso" className="relative isolate scroll-mt-32 overflow-hidden bg-surface py-16 text-body sm:py-24">
      {/* Retícula sutil de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5] [background-image:radial-gradient(circle_at_1px_1px,var(--line)_1px,transparent_0)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
      />
      <Container>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-brand-green-dark dark:text-brand-green">
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
              {eyebrow}
            </span>
            <h2 className="mt-5 text-balance text-[clamp(2.1rem,4.2vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.02em] text-heading">{title}</h2>
          </div>
          <p className="text-base leading-relaxed text-muted sm:text-lg lg:pb-2">{subtitle}</p>
        </div>

        <ol className={cn("mt-14 grid gap-0 sm:mt-20 lg:gap-6", cols)}>
          {steps.map((step, i) => {
            const Icon = icons[i % icons.length];
            const [duration, deliverable] = step.meta.split("·").map((x) => x.trim());
            const last = i === steps.length - 1;
            return (
              <Reveal key={step.title} as="li" delay={i * 90} className="relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-5 lg:block">
                {/* Nodo + flecha */}
                <div className="relative flex flex-col items-center lg:flex-row lg:items-center">
                  <span
                    className={cn(
                      "relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-[0_12px_30px_-12px_rgba(20,28,49,0.55)]",
                      last ? "bg-brand-green text-deep-700" : "bg-deep-700 text-white dark:bg-white dark:text-deep-700",
                    )}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                    <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-surface text-[0.7rem] font-bold tabular-nums text-heading ring-1 ring-line">
                      {i + 1}
                    </span>
                  </span>
                  {!last && (
                    <>
                      {/* Escritorio: flecha horizontal hasta el siguiente nodo */}
                      <div className="ml-3 hidden flex-1 items-center text-heading lg:flex">
                        <ArrowRightVector id={`flow-${i}`} />
                        <svg viewBox="0 0 12 12" className="-ml-1 h-3 w-3 shrink-0 text-brand-green-dark dark:text-brand-green" aria-hidden>
                          <path d="M1 1 L11 6 L1 11 Z" fill="currentColor" />
                        </svg>
                      </div>
                      {/* Celular: línea vertical punteada */}
                      <svg viewBox="0 0 2 100" preserveAspectRatio="none" className="mt-2 h-full min-h-16 w-0.5 flex-1 text-heading lg:hidden" aria-hidden>
                        <path d="M1 0 L1 100" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" vectorEffect="non-scaling-stroke" className="flow-dash" />
                      </svg>
                    </>
                  )}
                </div>

                {/* Tarjeta de la etapa */}
                <div className={cn("pb-10 lg:mt-6 lg:pb-0", last && "pb-0")}>
                  <div className="group h-full rounded-[1.75rem] bg-surface-soft p-6 ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-[0_24px_50px_-24px_rgba(20,28,49,0.35)] hover:ring-line dark:bg-white/[0.04] dark:hover:bg-white/[0.07]">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-green-dark dark:text-brand-green">
                      {stepLabel} {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 text-xl font-bold leading-snug text-heading">{step.title}</h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{step.description}</p>
                    <div className="mt-5 grid gap-2 border-t border-line pt-4 text-sm">
                      {duration && (
                        <span className="inline-flex items-center gap-2 font-semibold text-heading">
                          <Clock className="h-4 w-4 text-muted" aria-hidden />
                          {duration}
                        </span>
                      )}
                      {deliverable && (
                        <span className="inline-flex items-center gap-2 text-body">
                          <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden />
                          {deliverable}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ol>

        {/* Cierre */}
        <Reveal className="mt-14 flex flex-col items-start justify-between gap-5 rounded-[2rem] bg-deep-700 px-7 py-7 text-white sm:mt-20 sm:flex-row sm:items-center sm:px-10 dark:bg-white/[0.06]">
          <p className="max-w-2xl text-xl font-semibold leading-snug sm:text-2xl">{ctaTitle}</p>
          <Link href={ctaHref} className={cn(buttonClasses("primary", "lg"), "shrink-0")}>
            {ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
