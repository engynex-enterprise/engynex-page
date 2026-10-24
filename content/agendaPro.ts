import type { Locale } from "@/i18n/config";
import type { AppointmentKind, AppointmentStatus, MeetingChannel } from "@/lib/supabase/types";

/** Textos comunes de la agenda (tipos, estados, canales). */
const es = {
  kinds: {
    discovery: "Diagnóstico",
    demo: "Demo",
    proposal: "Propuesta",
    followup: "Seguimiento",
    support: "Soporte",
    other: "Otra",
  } satisfies Record<AppointmentKind, string>,
  statuses: { scheduled: "Agendada", done: "Realizada", no_show: "No asistió", cancelled: "Cancelada" } satisfies Record<AppointmentStatus, string>,
  channels: { meet: "Videollamada", call: "Llamada", whatsapp: "WhatsApp", in_person: "Presencial" } satisfies Record<MeetingChannel, string>,
  toClose: "Por cerrar",
};

export type AgendaProCopy = typeof es;

const en: AgendaProCopy = {
  kinds: { discovery: "Discovery", demo: "Demo", proposal: "Proposal", followup: "Follow-up", support: "Support", other: "Other" },
  statuses: { scheduled: "Scheduled", done: "Done", no_show: "No-show", cancelled: "Cancelled" },
  channels: { meet: "Video call", call: "Phone call", whatsapp: "WhatsApp", in_person: "In person" },
  toClose: "To close",
};

export const agendaProCopy: Record<Locale, AgendaProCopy> = { es, en };
