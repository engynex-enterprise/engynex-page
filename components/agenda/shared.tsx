import { MapPin, MessageCircle, Phone, Video, type LucideIcon } from "lucide-react";
import type { Appointment, AppointmentKind, AppointmentStatus, Availability, AvailabilityBlock, LeadTier, MeetingChannel } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/config";

/** Una reunión con los datos del lead que la agenda muestra. */
export type AgendaRow = Appointment & {
  lead: { id: string; name: string; email: string; phone: string; company: string | null; tier: LeadTier } | null;
};

/** Lo que recibe la vista de calendario. */
export type AgendaViewProps = {
  locale: Locale;
  items: AgendaRow[];
  names: Record<string, string>;
  availability: Availability[];
  blocks: AvailabilityBlock[];
  /** Abrir el panel de la reunión. */
  onOpen: (id: string) => void;
  /** Clic en un hueco vacío: agendar a esa hora (ISO). */
  onCreateAt: (iso: string) => void;
  /** Arrastrar una reunión a otra hora (ISO de inicio). */
  onReschedule: (id: string, iso: string) => void;
};

export const AGENDA_SELECT = "*, lead:leads(id, name, email, phone, company, tier)";
export const TZ = "America/Bogota";

export const channelIcon: Record<MeetingChannel, LucideIcon> = { meet: Video, call: Phone, whatsapp: MessageCircle, in_person: MapPin };

/** Color de la reunión según su estado (bloques del calendario y etiquetas). */
export const statusTone: Record<AppointmentStatus, string> = {
  scheduled: "bg-[var(--meta-active)] text-heading ring-1 ring-brand-green/50",
  done: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/30",
  no_show: "bg-amber-100 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30",
  cancelled: "bg-card-soft text-muted line-through ring-1 ring-line dark:bg-white/[0.05]",
};

export const kindDot: Record<AppointmentKind, string> = {
  discovery: "bg-sky-500",
  demo: "bg-violet-500",
  proposal: "bg-brand-green-dark",
  followup: "bg-amber-500",
  support: "bg-rose-500",
  other: "bg-zinc-400",
};

/** aaaa-mm-dd en Colombia. */
export const dayKey = (iso: string | number | Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
/** Instante ISO de una fecha y hora locales de Colombia (UTC−5 todo el año). */
export const bogotaIso = (day: string, time: string) => new Date(`${day}T${time}:00-05:00`).toISOString();
export const fmtTime = (locale: Locale, iso: string) => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
