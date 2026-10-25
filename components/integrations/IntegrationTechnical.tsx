"use client";

import type { IntegrationGuide } from "@/content/integrationGuides";
import { integrationsCopy } from "@/content/integrations";
import { integrationsHubCopy } from "@/content/integrationsHub";
import type { Locale } from "@/i18n/config";
import { CopyButton } from "./shared";

const card = "rounded-xl border border-line bg-surface p-5 dark:bg-card";

/** Parte técnica de la guía: funcionamiento, campos, endpoints, ejemplos y seguridad. */
export function IntegrationTechnical({ locale, guide, siteUrl }: { locale: Locale; guide: IntegrationGuide | undefined; siteUrl: string }) {
  const t = integrationsHubCopy[locale];
  const c = integrationsCopy[locale];
  if (!guide) return <p className={`${card} text-sm text-muted`}>{t.guide.missing}</p>;
  const x = guide.technical;
  const site = (s: string) => s.replaceAll("{site}", siteUrl);
  const h2 = "mb-3 text-[0.98rem] font-semibold text-heading";
  const list = (items: string[]) => (
    <ul className="grid list-disc gap-1.5 pl-5 text-sm leading-relaxed text-body">
      {items.map((i) => (
        <li key={i}>{site(i)}</li>
      ))}
    </ul>
  );

  return (
    <div className="grid gap-5">
      <section className={card}>
        <h2 className={h2}>{t.tech.how}</h2>
        <div className="grid gap-2.5 text-sm leading-relaxed text-body">
          {x.how.map((p) => (
            <p key={p}>{site(p)}</p>
          ))}
        </div>
      </section>

      {!!x.fields?.length && (
        <section className={card}>
          <h2 className={h2}>{t.tech.fields}</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                  <th scope="col" className="py-2.5 pr-4 font-medium">{t.tech.field}</th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">{t.tech.where}</th>
                  <th scope="col" className="py-2.5 font-medium">{t.tech.format}</th>
                </tr>
              </thead>
              <tbody>
                {x.fields.map((f) => (
                  <tr key={f.key} className="border-b border-line align-top last:border-0">
                    <td className="py-2.5 pr-4">
                      <span className="block font-medium text-heading">{c.fields[f.key]?.label ?? f.key}</span>
                      <code className="text-xs text-muted">{f.key}</code>
                    </td>
                    <td className="py-2.5 pr-4 text-body">{f.where}</td>
                    <td className="py-2.5">
                      <code className="break-all rounded bg-[var(--meta-active)] px-1.5 py-0.5 text-xs text-heading">{f.format}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!!x.endpoints?.length && (
        <section className={card}>
          <h2 className={h2}>{t.tech.endpoints}</h2>
          <ul className="grid gap-3">
            {x.endpoints.map((e) => (
              <li key={e.label + e.url}>
                <p className="mb-1 text-xs font-medium text-muted">{e.label}</p>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 rounded-md bg-deep-700 px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold text-white dark:bg-white dark:text-deep-700">{e.method}</span>
                  <code className="min-w-0 flex-1 truncate rounded-[10px] bg-[var(--meta-active)] px-3 py-2 text-sm text-heading">{site(e.url)}</code>
                  <CopyButton value={site(e.url)} label={c.copy} done={c.copied} />
                </div>
                {e.note && <p className="mt-1 text-xs text-muted">{site(e.note)}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {!!x.permissions?.length && (
          <section className={card}>
            <h2 className={h2}>{t.tech.permissions}</h2>
            {list(x.permissions)}
          </section>
        )}
        <section className={card}>
          <h2 className={h2}>{t.tech.security}</h2>
          {list(x.security)}
        </section>
        {!!x.limits?.length && (
          <section className={card}>
            <h2 className={h2}>{t.tech.limits}</h2>
            {list(x.limits)}
          </section>
        )}
      </div>

      {!!x.examples?.length && (
        <section className={card}>
          <h2 className={h2}>{t.tech.examples}</h2>
          <div className="grid gap-4">
            {x.examples.map((ex) => (
              <div key={ex.title}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-heading">
                    {ex.title} <span className="text-xs font-normal uppercase text-muted">{ex.lang}</span>
                  </p>
                  <CopyButton value={site(ex.code)} label={c.copy} done={c.copied} />
                </div>
                <pre className="max-h-80 overflow-auto rounded-xl bg-deep-700 p-4 text-[0.8rem] leading-relaxed text-white dark:bg-black/40">
                  <code>{site(ex.code)}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>
      )}

      {guide.troubleshooting.length > 0 && (
        <section className={card}>
          <h2 className={h2}>{t.tech.trouble}</h2>
          <div className="divide-y divide-line">
            {guide.troubleshooting.map((p) => (
              <details key={p.problem} className="group py-2.5">
                <summary className="cursor-pointer list-none text-sm font-medium text-heading">
                  <span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden>›</span>
                  {p.problem}
                </summary>
                <p className="mt-1.5 pl-5 text-sm leading-relaxed text-body">{site(p.fix)}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
