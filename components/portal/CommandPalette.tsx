"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CornerDownLeft, Headset, MessagesSquare, Search, UserRound, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { shellCopy } from "@/content/shell";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Result = { key: string; group: keyof (typeof shellCopy)["es"]["searchGroups"]; title: string; sub?: string; href: string; icon: LucideIcon };
type SearchData = {
  leads?: { id: string; name: string; email: string; company: string | null; tier: string }[];
  chats?: { id: string; name: string; email: string | null; last_message: string | null; channel: string }[];
  tickets?: { id: string; number: number; subject: string; name: string; status: string }[];
  accounts?: { id: string; full_name: string | null; email: string; company: string | null; kind: string }[];
};

export const OPEN_SEARCH_EVENT = "engynex-open-search";

/**
 * Buscador global (Ctrl+K / ⌘K): páginas del portal y, con los permisos de
 * quien busca, leads, conversaciones, solicitudes y cuentas.
 */
export function CommandPalette({
  locale,
  pages,
}: {
  locale: Locale;
  pages: { label: string; href: string; icon: LucideIcon }[];
}) {
  const t = shellCopy[locale];
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState<SearchData>({});
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Búsqueda en la base (con una pequeña espera mientras se escribe).
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const id = window.setTimeout(async () => {
      const { data: result } = await supabase.rpc("global_search", { p_q: term });
      setData((result ?? {}) as SearchData);
      setActive(0);
    }, 200);
    return () => window.clearTimeout(id);
  }, [q, supabase]);

  const base = `/${locale}/portal`;
  const term = q.trim().toLowerCase();
  const results: Result[] = term.length < 2
    ? pages.map((p) => ({ key: `p-${p.href}`, group: "pages" as const, title: p.label, href: p.href, icon: p.icon }))
    : [
        ...pages
          .filter((p) => p.label.toLowerCase().includes(term))
          .map((p) => ({ key: `p-${p.href}`, group: "pages" as const, title: p.label, href: p.href, icon: p.icon })),
        ...(data.leads ?? []).map((l) => ({ key: `l-${l.id}`, group: "leads" as const, title: l.name, sub: [l.company, l.email].filter(Boolean).join(" · "), href: `${base}/crm/${l.id}`, icon: UserRound })),
        ...(data.chats ?? []).map((c) => ({ key: `c-${c.id}`, group: "chats" as const, title: c.name, sub: c.last_message ?? c.email ?? "", href: `${base}/chat?c=${c.id}`, icon: MessagesSquare })),
        ...(data.tickets ?? []).map((x) => ({ key: `t-${x.id}`, group: "tickets" as const, title: `#${x.number} · ${x.subject}`, sub: x.name, href: `${base}/soporte/${x.id}`, icon: Headset })),
        ...(data.accounts ?? []).map((a) => ({ key: `a-${a.id}`, group: "accounts" as const, title: a.full_name ?? a.email, sub: [a.company, a.email].filter(Boolean).join(" · "), href: `${base}/clientes/${a.id}`, icon: Building2 })),
      ];

  const close = () => {
    setOpen(false);
    setQ("");
    setData({});
  };
  const go = (r: Result | undefined) => {
    if (!r) return;
    close();
    router.push(r.href);
  };

  if (!open) return null;

  let index = -1;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 px-3 pt-[12vh]" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-label={t.search} className="w-full max-w-xl overflow-hidden rounded-lg bg-surface shadow-[0_12px_28px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:bg-card">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") close();
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
              if (event.key === "Enter") go(results[active]);
            }}
            placeholder={t.searchPlaceholder}
            aria-label={t.search}
            className="h-14 min-w-0 flex-1 bg-transparent text-[0.95rem] text-heading outline-none placeholder:text-muted focus:outline-none focus-visible:outline-none"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[0.7rem] text-muted">Esc</kbd>
        </div>
        <ul role="listbox" className="max-h-[60dvh] overflow-y-auto p-2">
          {term.length >= 2 && results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted">{t.searchEmpty.replace("{q}", q.trim())}</li>
          )}
          {results.map((r, i) => {
            const showGroup = i === 0 || results[i - 1].group !== r.group;
            index++;
            const Icon = r.icon;
            const isActive = index === active;
            return (
              <li key={r.key}>
                {showGroup && <p className="px-3 pb-1 pt-3 text-xs font-semibold text-muted">{t.searchGroups[r.group]}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", isActive ? "bg-[var(--meta-active)]" : "hover:bg-[var(--meta-hover)]")}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card-soft text-heading">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-heading">{r.title}</span>
                    {r.sub && <span className="block truncate text-xs text-muted">{r.sub}</span>}
                  </span>
                  {isActive && <CornerDownLeft className="h-4 w-4 shrink-0 text-muted" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-line px-4 py-2 text-[0.7rem] text-muted">{t.searchKeys}</p>
      </div>
    </div>
  );
}
