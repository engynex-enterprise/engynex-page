"use client";

import { useMemo, useState } from "react";
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
import { GripVertical } from "lucide-react";
import { supportProCopy } from "@/content/supportPro";
import { supportQueueCopy } from "@/content/supportQueue";
import { ticketsCopy } from "@/content/tickets";
import type { Locale } from "@/i18n/config";
import { shortDuration, slaState, slaTone } from "@/lib/supportSla";
import { ticketPriorityTone } from "@/lib/tickets";
import type { Ticket, TicketStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const COLUMNS: TicketStatus[] = ["open", "in_progress", "waiting", "resolved"];
const PAGE = 25;
const dot: Record<TicketStatus, string> = {
  open: "bg-sky-500",
  in_progress: "bg-amber-500",
  waiting: "bg-violet-500",
  resolved: "bg-emerald-500",
  closed: "bg-zinc-400",
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

/**
 * Tablero por estado. Arrastrar una tarjeta a otra columna cambia el estado
 * (con teclado, desde el asa: Espacio para tomar, flechas y Espacio para soltar).
 */
export function QueueBoard({
  locale,
  tickets,
  names,
  now,
  onMove,
}: {
  locale: Locale;
  tickets: Ticket[];
  names: Record<string, string>;
  now: number;
  onMove: (id: string, status: TicketStatus) => void;
}) {
  const t = supportQueueCopy[locale];
  const tc = ticketsCopy[locale];
  const [dragging, setDragging] = useState<Ticket | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [announcement, setAnnouncement] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const columns = useMemo(() => {
    const by = Object.fromEntries(COLUMNS.map((s) => [s, [] as Ticket[]])) as Record<TicketStatus, Ticket[]>;
    for (const x of tickets) by[x.status]?.push(x);
    return by;
  }, [tickets]);

  const onDragStart = (e: DragStartEvent) => setDragging(tickets.find((x) => x.id === e.active.id) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const x = tickets.find((y) => y.id === e.active.id);
    const status = e.over?.id as TicketStatus | undefined;
    if (!x || !status || x.status === status) return;
    onMove(x.id, status);
    setAnnouncement(t.board.moved.replace("{n}", String(x.number)).replace("{status}", tc.staffStatus[status]));
  };

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div role="region" aria-label={t.views.board} className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          {COLUMNS.map((status) => {
            const all = columns[status];
            const list = status === "resolved" ? all.slice(0, shown) : all;
            return (
              <Column key={status} status={status} title={tc.staffStatus[status]} count={all.length} empty={t.board.empty}>
                {list.map((x) => (
                  <Card key={x.id} ticket={x} locale={locale} names={names} now={now} />
                ))}
                {status === "resolved" && all.length > shown && (
                  <li>
                    <button type="button" onClick={() => setShown((n) => n + PAGE)} className="h-9 w-full rounded-lg text-sm font-medium text-accent hover:bg-[var(--meta-hover)]">
                      {t.board.more.replace("{n}", String(all.length - shown))}
                    </button>
                  </li>
                )}
              </Column>
            );
          })}
        </div>
        <DragOverlay>{dragging && <CardBody ticket={dragging} locale={locale} names={names} now={now} lifted />}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ status, title, count, empty, children }: { status: TicketStatus; title: string; count: number; empty: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={`${title} · ${count}`}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl p-2.5 transition-colors xl:w-auto xl:min-w-0 xl:flex-1",
        isOver ? "bg-[var(--meta-active)] ring-2 ring-brand-green/50" : "bg-[#f4f4f5] dark:bg-white/[0.03]",
      )}
    >
      <header className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
        <span className={cn("h-2.5 w-2.5 rounded-full", dot[status])} aria-hidden />
        <h3 className="text-sm font-semibold text-heading">{title}</h3>
        <span className="rounded-md bg-surface px-1.5 text-xs tabular-nums text-muted dark:bg-white/10">{count}</span>
      </header>
      <ul className="grid min-h-28 content-start gap-2">
        {count === 0 ? <li className="grid h-24 place-items-center rounded-lg border border-dashed border-line-strong text-xs text-muted">{empty}</li> : children}
      </ul>
    </section>
  );
}

function Card({ ticket, locale, names, now }: { ticket: Ticket; locale: Locale; names: Record<string, string>; now: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id });
  const { onPointerDown, onKeyDown } = (listeners ?? {}) as { onPointerDown?: React.PointerEventHandler; onKeyDown?: React.KeyboardEventHandler };
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} className={cn("group relative", isDragging && "opacity-40")}>
      <div onPointerDown={onPointerDown} className="cursor-grab touch-none active:cursor-grabbing">
        <Link href={`/${locale}/portal/soporte/${ticket.id}`} draggable={false} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-green">
          <CardBody ticket={ticket} locale={locale} names={names} now={now} />
        </Link>
      </div>
      <span
        {...attributes}
        onKeyDown={onKeyDown}
        aria-label={`#${ticket.number}`}
        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-md text-muted opacity-0 outline-none hover:bg-[var(--meta-hover)] focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-green group-hover:opacity-100"
      >
        <GripVertical className="h-3.5 w-3.5" aria-hidden />
      </span>
    </li>
  );
}

function CardBody({ ticket, locale, names, now, lifted = false }: { ticket: Ticket; locale: Locale; names: Record<string, string>; now: number; lifted?: boolean }) {
  const t = supportQueueCopy[locale];
  const pro = supportProCopy[locale];
  const tc = ticketsCopy[locale];
  const sla = slaState(ticket, now);
  const owner = ticket.assigned_to ? names[ticket.assigned_to] : undefined;
  return (
    <div
      className={cn(
        "rounded-xl bg-surface p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_0_0_1px_rgba(16,24,40,0.06)] transition-shadow hover:shadow-[0_6px_16px_-6px_rgba(16,24,40,0.18),0_0_0_1px_rgba(16,24,40,0.08)] dark:bg-card",
        lifted && "rotate-2 shadow-[0_16px_32px_-8px_rgba(16,24,40,0.3)]",
      )}
    >
      <p className="pr-5 font-mono text-xs text-muted">#{ticket.number}</p>
      <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-heading">{ticket.subject}</p>
      <p className="mt-1 truncate text-xs text-body">{ticket.company ? `${ticket.name} · ${ticket.company}` : ticket.name}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className={cn("font-semibold", ticketPriorityTone[ticket.priority])}>{tc.priority[ticket.priority]}</span>
        {(ticket.tags ?? []).slice(0, 2).map((tag) => (
          <span key={tag} className="inline-flex h-5 items-center rounded-md bg-card-soft px-1.5 text-[0.7rem] text-muted dark:bg-white/[0.06]">
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className={cn("min-w-0 flex-1 truncate font-medium tabular-nums", slaTone(sla))}>
          {sla ? (sla.breached ? pro.sla.breached : pro.sla.left).replace("{t}", shortDuration(sla.left, pro.units)) : ""}
        </span>
        <span
          title={owner ?? t.unassigned}
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.62rem] font-bold",
            owner ? "bg-deep-700/10 text-deep-700 dark:bg-white/10 dark:text-white" : "border border-dashed border-line-strong text-muted",
          )}
        >
          {owner ? initials(owner) : "?"}
          <span className="sr-only">{owner ?? t.unassigned}</span>
        </span>
      </div>
    </div>
  );
}
