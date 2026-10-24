import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/portal/PageHeader";
import { ticketsCopy } from "@/content/tickets";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Filter = "all" | "client" | "provider";

export default async function AccountsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireProfile(locale, ["admin", "sales", "support"]);
  const t = ticketsCopy[locale].accounts;
  const { k } = await searchParams;
  const filter: Filter = k === "client" || k === "provider" ? k : "all";

  let query = supabase.from("profiles").select("id, full_name, email, company, kind, active, last_seen_at").order("full_name");
  query = filter === "all" ? query.in("kind", ["client", "provider"]) : query.eq("kind", filter);
  const [{ data: accounts }, { data: openTickets }, { data: docs }] = await Promise.all([
    query,
    supabase.from("tickets").select("requester_id").in("status", ["open", "in_progress", "waiting"]).not("requester_id", "is", null),
    supabase.from("documents").select("owner_id"),
  ]);
  const count = (rows: { [k: string]: string | null }[] | null, key: string) =>
    (rows ?? []).reduce<Record<string, number>>((acc, r) => {
      const id = r[key];
      if (id) acc[id] = (acc[id] ?? 0) + 1;
      return acc;
    }, {});
  const tickets = count(openTickets, "requester_id");
  const documents = count(docs, "owner_id");
  const fmt = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(iso)) : t.never;
  const base = `/${locale}/portal/clientes`;

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <nav aria-label={t.title} className="mb-5 flex gap-1.5">
        {(Object.keys(t.filters) as Filter[]).map((key) => (
          <Link
            key={key}
            href={key === "all" ? base : `${base}?k=${key}`}
            aria-current={filter === key ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold",
              filter === key ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "text-heading ring-1 ring-line-strong hover:bg-surface-soft",
            )}
          >
            {t.filters[key]}
          </Link>
        ))}
      </nav>
      {!accounts?.length ? (
        <p className="rounded-lg bg-surface p-10 text-center text-sm text-muted shadow-meta dark:bg-card">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-surface shadow-meta dark:bg-card">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                {(["name", "company", "kind", "tickets", "docs", "lastSeen"] as const).map((c) => (
                  <th key={c} scope="col" className={cn("px-4 py-3 font-semibold", (c === "tickets" || c === "docs") && "text-right")}>{t.cols[c]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {accounts.map((a) => (
                <tr key={a.id} className={cn("hover:bg-surface-soft/60 dark:hover:bg-white/[0.03]", !a.active && "opacity-60")}>
                  <td className="px-4 py-3">
                    <Link href={`${base}/${a.id}`} className="font-bold text-heading hover:underline">{a.full_name ?? a.email}</Link>
                    <span className="block text-xs text-muted">{a.email}</span>
                  </td>
                  <td className="px-4 py-3 text-body">{a.company ?? "—"}</td>
                  <td className="px-4 py-3 text-body">{t.kinds[a.kind]}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-heading">{tickets[a.id] ?? 0}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-heading">{documents[a.id] ?? 0}</td>
                  <td className="px-4 py-3 text-body">{fmt(a.last_seen_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
