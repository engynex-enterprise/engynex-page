import { CircleCheck, Coins, ListChecks, Sparkles } from "lucide-react";
import type { IntegrationGuide } from "@/content/integrationGuides";
import type { IntegrationsHubCopy } from "@/content/integrationsHub";

const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";

/** Guía para cualquier persona: para qué sirve, costo, requisitos y paso a paso. */
export function IntegrationGuideView({ guide, t }: { guide: IntegrationGuide | undefined; t: IntegrationsHubCopy }) {
  if (!guide) return <p className={`${card} text-sm text-muted`}>{t.guide.missing}</p>;
  const head = (Icon: typeof Sparkles, title: string) => (
    <h2 className="mb-3 flex items-center gap-2 text-[0.98rem] font-semibold text-heading">
      <Icon className="h-4 w-4 text-accent" aria-hidden />
      {title}
    </h2>
  );
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid content-start gap-5">
        <p className="text-[1.02rem] leading-relaxed text-heading">{guide.summary}</p>
        <section className={card}>
          {head(ListChecks, t.guide.steps)}
          <ol className="grid gap-4">
            {guide.steps.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-green text-sm font-semibold text-deep-700">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-heading">{s.title}</p>
                  <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-body">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        {guide.verify.length > 0 && (
          <section className={card}>
            {head(CircleCheck, t.guide.verify)}
            <ul className="grid gap-2 text-sm text-body">
              {guide.verify.map((v) => (
                <li key={v} className="flex gap-2">
                  <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  {v}
                </li>
              ))}
            </ul>
          </section>
        )}
        {guide.troubleshooting.length > 0 && (
          <section className={card}>
            <h2 className="mb-3 text-[0.98rem] font-semibold text-heading">{t.guide.trouble}</h2>
            <div className="divide-y divide-line">
              {guide.troubleshooting.map((x) => (
                <details key={x.problem} className="group py-2.5">
                  <summary className="cursor-pointer list-none text-sm font-medium text-heading marker:hidden">
                    <span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden>›</span>
                    {x.problem}
                  </summary>
                  <p className="mt-1.5 pl-5 text-sm leading-relaxed text-body">{x.fix}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
      <aside className="grid content-start gap-5">
        <section className={card}>
          {head(Sparkles, t.guide.benefits)}
          <ul className="grid gap-2 text-sm text-body">
            {guide.benefits.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green-dark dark:bg-brand-green" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </section>
        <section className={card}>
          {head(Coins, t.guide.cost)}
          <p className="text-sm leading-relaxed text-body">{guide.cost}</p>
        </section>
        {guide.before.length > 0 && (
          <section className={card}>
            <h2 className="mb-3 text-[0.98rem] font-semibold text-heading">{t.guide.before}</h2>
            <ul className="grid list-disc gap-1.5 pl-5 text-sm text-body">
              {guide.before.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
