import type { PageView } from "@/lib/supabase/types";
import { analyticsCopy } from "@/content/analytics";
import type { Locale } from "@/i18n/config";

/** Recorrido de un visitante: páginas en orden, con tiempo y scroll. */
export function Journey({
  locale,
  views,
}: {
  locale: Locale;
  views: Pick<PageView, "id" | "path" | "title" | "created_at" | "duration_ms" | "max_scroll" | "session_id">[];
}) {
  const t = analyticsCopy[locale];
  if (views.length === 0) return <p className="text-sm text-muted">{t.journeyEmpty}</p>;
  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
  const ordered = [...views].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return (
    <ol className="grid gap-0">
      {ordered.map((v, i) => {
        const newSession = i > 0 && v.session_id !== ordered[i - 1].session_id;
        const secs = v.duration_ms ? Math.round(v.duration_ms / 1000) : null;
        return (
          <li key={v.id} className={newSession ? "mt-3 border-t border-dashed border-line pt-3" : ""}>
            <div className="flex items-start gap-3 py-1.5">
              <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-deep-700 dark:bg-[#9fb0d8]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-heading">{v.path}</p>
                <p className="text-xs text-muted">
                  {fmt.format(new Date(v.created_at))}
                  {secs !== null && ` · ${secs >= 60 ? `${Math.floor(secs / 60)} min ${secs % 60} ${t.seconds}` : `${secs} ${t.seconds}`}`}
                  {v.max_scroll !== null && ` · scroll ${v.max_scroll}%`}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
