"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { KanbanSquare, List, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadStatus, LeadTier } from "@/lib/supabase/types";
import { crmCopy, pipeline } from "@/content/crm";
import { leadFormCopy } from "@/content/leadForm";
import { formatCOP } from "@/content/pricing";
import { inputClass } from "@/components/auth/inputClass";
import { Select } from "@/components/ui/Select";
import { tierStyles } from "@/lib/tiers";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type CrmLead = Pick<
  Lead,
  | "id"
  | "name"
  | "email"
  | "company"
  | "tier"
  | "score"
  | "status"
  | "assigned_to"
  | "value_cop"
  | "created_at"
  | "last_activity_at"
  | "problem_category"
>;

export interface Employee {
  id: string;
  name: string;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/**
 * Embudo de ventas. Las tarjetas se arrastran entre etapas (ratón, táctil o
 * teclado: espacio para tomar, flechas para mover, espacio para soltar). Los
 * cambios se guardan al instante y llegan en vivo a los demás asesores.
 */
export function CrmBoard({
  locale,
  initialLeads,
  employees,
  canEdit,
  currentUserId,
}: {
  locale: Locale;
  initialLeads: CrmLead[];
  employees: Employee[];
  canEdit: boolean;
  currentUserId: string;
}) {
  const t = crmCopy[locale];
  const problems = leadFormCopy[locale].steps.problem.options;
  const [leads, setLeads] = useState(initialLeads);
  const [view, setView] = useState<"board" | "list">("board");
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<LeadTier | "all">("all");
  const [owner, setOwner] = useState<string>("all");
  const [dragging, setDragging] = useState<CrmLead | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const names = useMemo(
    () => new Map(employees.map((e) => [e.id, e.name])),
    [employees],
  );

  // Tiempo real: cualquier alta o cambio en leads se refleja aquí.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("crm-leads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id: string }).id;
            setLeads((list) => list.filter((l) => l.id !== id));
            return;
          }
          const row = payload.new as CrmLead;
          setLeads((list) => {
            const exists = list.some((l) => l.id === row.id);
            return exists
              ? list.map((l) => (l.id === row.id ? { ...l, ...row } : l))
              : [row, ...list];
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (tier === "all" || l.tier === tier) &&
        (owner === "all" ||
          (owner === "mine" && l.assigned_to === currentUserId) ||
          (owner === "none" && !l.assigned_to) ||
          l.assigned_to === owner) &&
        (!q ||
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.company ?? "").toLowerCase().includes(q)),
    );
  }, [leads, query, tier, owner, currentUserId]);

  const openValue = filtered
    .filter((l) => !["won", "lost"].includes(l.status))
    .reduce((sum, l) => sum + (l.value_cop ?? 0), 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const move = async (id: string, status: LeadStatus) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;
    setLeads((list) => list.map((l) => (l.id === id ? { ...l, status } : l)));
    setAnnouncement(t.crm.moved.replace("{name}", lead.name).replace("{status}", t.status[status]));
    const { error } = await createClient().from("leads").update({ status }).eq("id", id);
    if (error) {
      // Revertir si la base de datos no lo aceptó.
      setLeads((list) => list.map((l) => (l.id === id ? { ...l, status: lead.status } : l)));
    }
  };

  const onDragStart = (event: DragStartEvent) =>
    setDragging(leads.find((l) => l.id === event.active.id) ?? null);
  const onDragEnd = (event: DragEndEvent) => {
    setDragging(null);
    if (event.over) void move(String(event.active.id), event.over.id as LeadStatus);
  };

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "America/Bogota" }).format(new Date(iso));

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {/* Filtros */}
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative block md:w-80">
            <span className="sr-only">{t.crm.search}</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.crm.search}
              className={cn(inputClass, "h-11 rounded-full pl-10")}
            />
          </label>
          <div role="group" aria-label={t.crm.allTiers} className="flex flex-wrap gap-1.5">
            {(["all", "green", "yellow", "red"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={tier === k}
                onClick={() => setTier(k)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
                  tier === k
                    ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700"
                    : "text-heading ring-1 ring-line-strong hover:bg-surface",
                )}
              >
                {k !== "all" && <span className={cn("h-2 w-2 rounded-full", tierStyles[k].dot)} aria-hidden />}
                {k === "all" ? t.crm.allTiers : t.tier[k]}
              </button>
            ))}
          </div>
          <Select
            size="sm"
            label={t.crm.columns.owner}
            value={owner}
            onChange={setOwner}
            options={[
              { value: "all", label: t.crm.allOwners },
              { value: "mine", label: t.crm.mine },
              { value: "none", label: t.crm.unassigned },
              ...employees.map((e) => ({ value: e.id, label: e.name })),
            ]}
            className="md:w-56"
          />
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm text-muted">
            {t.crm.total.replace("{n}", String(filtered.length))}
            {openValue > 0 && (
              <>
                {" · "}
                {t.crm.pipelineValue}: <span className="font-bold text-heading">{formatCOP(openValue)}</span>
              </>
            )}
          </p>
          <div role="group" aria-label="Vista" className="flex rounded-full bg-surface p-1 shadow-meta dark:bg-card">
            {(["board", "list"] as const).map((v) => {
              const Icon = v === "board" ? KanbanSquare : List;
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors",
                    view === v ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700" : "text-heading",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {v === "board" ? t.crm.board : t.crm.list}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="rounded-lg bg-surface p-8 text-center text-sm text-muted shadow-meta dark:bg-card">
          {t.crm.empty}
        </p>
      )}

      {/* Embudo */}
      {view === "board" && filtered.length > 0 && (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
          {canEdit && <p className="mb-3 text-xs text-muted">{t.crm.dragHint}</p>}
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
            {pipeline.map((status) => {
              const column = filtered
                .filter((l) => l.status === status)
                .sort((a, b) => Date.parse(b.last_activity_at) - Date.parse(a.last_activity_at));
              const total = column.reduce((sum, l) => sum + (l.value_cop ?? 0), 0);
              return (
                <Column
                  key={status}
                  id={status}
                  title={t.status[status]}
                  count={column.length}
                  total={total ? formatCOP(total) : null}
                >
                  {column.map((lead) => (
                    <Card
                      key={lead.id}
                      lead={lead}
                      locale={locale}
                      draggable={canEdit}
                      ownerName={lead.assigned_to ? names.get(lead.assigned_to) : undefined}
                      problem={problems[lead.problem_category as keyof typeof problems] ?? lead.problem_category}
                      scoreLabel={t.lead.score}
                    />
                  ))}
                </Column>
              );
            })}
          </div>
          <DragOverlay>
            {dragging && (
              <CardBody
                lead={dragging}
                ownerName={dragging.assigned_to ? names.get(dragging.assigned_to) : undefined}
                problem={problems[dragging.problem_category as keyof typeof problems] ?? dragging.problem_category}
                scoreLabel={t.lead.score}
                lifted
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Lista */}
      {view === "list" && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-surface shadow-meta dark:bg-card">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                {(["lead", "tier", "score", "status", "owner", "value", "created"] as const).map((c) => (
                  <th key={c} scope="col" className="px-5 py-3 font-semibold">
                    {t.crm.columns[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...filtered]
                .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
                .map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface-soft dark:hover:bg-white/[0.03]">
                    <td className="px-5 py-3">
                      <Link href={`/${locale}/portal/crm/${lead.id}`} className="font-bold text-heading hover:underline">
                        {lead.name}
                      </Link>
                      <p className="text-xs text-muted">{lead.company ?? lead.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 text-body">
                        <span className={cn("h-2.5 w-2.5 rounded-full", tierStyles[lead.tier].dot)} aria-hidden />
                        {t.tier[lead.tier]}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold tabular-nums text-heading">{lead.score}</td>
                    <td className="px-5 py-3 text-body">{t.status[lead.status]}</td>
                    <td className="px-5 py-3 text-body">
                      {lead.assigned_to ? names.get(lead.assigned_to) ?? "—" : t.crm.unassigned}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-body">{lead.value_cop ? formatCOP(lead.value_cop) : "—"}</td>
                    <td className="px-5 py-3 text-body">{fmtDate(lead.created_at)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Column({
  id,
  title,
  count,
  total,
  children,
}: {
  id: LeadStatus;
  title: string;
  count: number;
  total: string | null;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      aria-label={title}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg p-3 transition-colors",
        isOver ? "bg-accent-soft ring-2 ring-action" : "bg-card-soft/60 dark:bg-white/[0.03]",
      )}
    >
      <header className="flex items-baseline justify-between gap-2 px-2 pb-3 pt-1">
        <h2 className="text-sm text-heading">
          {title} <span className="font-normal text-muted">· {count}</span>
        </h2>
        {total && <span className="text-xs font-semibold tabular-nums text-muted">{total}</span>}
      </header>
      <ul className="grid min-h-24 content-start gap-2">{children}</ul>
    </section>
  );
}

function Card({
  lead,
  locale,
  draggable,
  ownerName,
  problem,
  scoreLabel,
}: {
  lead: CrmLead;
  locale: Locale;
  draggable: boolean;
  ownerName?: string;
  problem: string;
  scoreLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: !draggable,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(isDragging && "opacity-40")}
    >
      <div {...(draggable ? listeners : {})} {...(draggable ? attributes : {})} className={cn(draggable && "cursor-grab touch-none active:cursor-grabbing", "rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-deep-700")}>
        <Link href={`/${locale}/portal/crm/${lead.id}`} className="block" draggable={false}>
          <CardBody lead={lead} ownerName={ownerName} problem={problem} scoreLabel={scoreLabel} />
        </Link>
      </div>
    </li>
  );
}

function CardBody({
  lead,
  ownerName,
  problem,
  scoreLabel,
  lifted = false,
}: {
  lead: CrmLead;
  ownerName?: string;
  problem: string;
  scoreLabel: string;
  lifted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg bg-surface p-4 shadow-meta transition-shadow hover:shadow-card dark:bg-card",
        lifted && "rotate-2 shadow-card-hover",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-heading">{lead.name}</p>
          <p className="truncate text-xs text-muted">{lead.company ?? lead.email}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", tierStyles[lead.tier].pill)} title={scoreLabel}>
          {lead.score}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-body">{problem}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tabular-nums text-heading">
          {lead.value_cop ? formatCOP(lead.value_cop) : ""}
        </span>
        {ownerName ? (
          <span
            title={ownerName}
            className="grid h-6 w-6 place-items-center rounded-full bg-deep-700 text-[0.6rem] font-bold text-white dark:bg-white dark:text-deep-700"
          >
            {initials(ownerName)}
          </span>
        ) : (
          <span className="h-6 w-6 rounded-full border border-dashed border-line-strong" aria-hidden />
        )}
      </div>
    </div>
  );
}
