import { BookOpen, CircleDollarSign, ExternalLink, LifeBuoy, LogIn, Activity, Settings2 } from "lucide-react";
import type { IntegrationsHubCopy } from "@/content/integrationsHub";
import type { IntegrationDef, IntegrationLink } from "@/lib/integrationCatalog";

const KIND_ORDER: IntegrationLink["kind"][] = ["account", "console", "docs", "pricing", "status", "help"];
const KIND_ICON: Record<IntegrationLink["kind"], typeof BookOpen> = {
  account: LogIn,
  console: Settings2,
  docs: BookOpen,
  pricing: CircleDollarSign,
  status: Activity,
  help: LifeBuoy,
};

/** Enlaces del proveedor agrupados: cuenta, consola, documentación, precios, estado y ayuda. */
export function IntegrationLinks({ def, t }: { def: IntegrationDef; t: IntegrationsHubCopy }) {
  const groups = KIND_ORDER.map((kind) => ({ kind, links: def.links.filter((l) => l.kind === kind) })).filter((g) => g.links.length);
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {groups.map(({ kind, links }) => {
        const Icon = KIND_ICON[kind];
        return (
          <section key={kind} className="rounded-xl border border-line bg-surface p-5 dark:bg-card">
            <h2 className="mb-3 flex items-center gap-2 text-[0.98rem] font-semibold text-heading">
              <Icon className="h-4 w-4 text-accent" aria-hidden />
              {t.linkKinds[kind]}
            </h2>
            <ul className="grid gap-1">
              {links.map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--meta-hover)]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-heading group-hover:underline">{l.label}</span>
                      <span className="block truncate text-xs text-muted">{l.url.replace(/^https:\/\//, "")}</span>
                    </span>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                    <span className="sr-only">{t.external}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
