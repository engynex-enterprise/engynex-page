/**
 * Ajustes del chat en vivo (tabla chat_settings) y el protocolo en tiempo
 * real entre el widget del sitio y el portal.
 */

export type FieldMode = "required" | "optional" | "hidden";
export type RoutingMode = "off" | "round_robin" | "least_busy";
export type ChatTexts = { title: string; launcher: string; greeting: string; greeting_away: string; invite: string };
/** `priority`: mayor número, se revisa primero (por defecto 0). */
export type ChatFaq = { keywords: string[]; answer: string; answer_en?: string; priority?: number };
export type ChatIntentText = { answer?: string; answer_en?: string };
export type ChatQuickReply = { label: string; label_en?: string };
export type ChatAiMode = "assist" | "offline" | "always";
export type ChatAiProvider = "anthropic" | "openai" | "gemini";
/**
 * Respuestas automáticas del chat. `ai` lo usa el piloto automático con IA
 * (assist: solo sugiere al asesor; offline: responde fuera de horario o sin
 * asesores; always: responde siempre mientras nadie del equipo conteste).
 */
export type ChatBotConfig = {
  enabled: boolean;
  faqs: ChatFaq[];
  intents_enabled?: boolean;
  intents?: { sales?: ChatIntentText; support?: ChatIntentText };
  page_greetings?: { enabled: boolean; text: string; text_en: string };
  quick_replies?: ChatQuickReply[];
  wait_message?: { enabled: boolean; minutes: number; text: string; text_en: string };
  auto_lead?: boolean;
  ai?: { enabled: boolean; mode: ChatAiMode; provider: ChatAiProvider } & Record<string, unknown>;
};
export type ChatInvite = { path: string; delay: number; es: string; en: string };
/** 1 = lunes … 7 = domingo (ISO). Sin entrada = cerrado ese día. */
export type DayKey = "1" | "2" | "3" | "4" | "5" | "6" | "7";

export type ChatConfig = {
  enabled: boolean;
  color: string;
  position: "right" | "left";
  show_agents: boolean;
  texts: { es: ChatTexts; en: ChatTexts };
  fields: { email: FieldMode; phone: FieldMode };
  exclude_paths: string[];
  hours: { enabled: boolean; email_team: boolean; days: Partial<Record<DayKey, [string, string]>> };
  bot: ChatBotConfig;
  routing: { mode: RoutingMode; max_chats: number };
  auto_close_minutes: number;
  invites: ChatInvite[];
  invite_delay: number;
  exit_intent: boolean;
};

/** Lo que recibe el widget (rpc chat_public_config). */
export type PublicChatConfig = {
  enabled: boolean;
  color: string | null;
  position: "right" | "left";
  show_agents: boolean;
  texts: ChatTexts | null;
  fields: { email: FieldMode; phone: FieldMode } | null;
  exclude_paths: string[];
  open_now: boolean;
  hours: Partial<Record<DayKey, [string, string]>> | null;
  invites: { path: string; delay: number; text: string }[];
  invite_delay: number;
  exit_intent: boolean;
  /** Botones que el widget ofrece antes de que responda un asesor. */
  quick_replies?: string[];
  /** Saludo para páginas de servicio; {servicio}/{service} = nombre del servicio. */
  page_greeting?: string | null;
  ai?: { enabled: boolean; mode: ChatAiMode };
};

export const DAY_KEYS: DayKey[] = ["1", "2", "3", "4", "5", "6", "7"];

/** ¿El widget se oculta en esta ruta? */
export const pathExcluded = (pathname: string, excluded: string[]) =>
  excluded.some((p) => p && (pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`)));

/** Invitación que aplica a la ruta (la más específica). */
export const inviteFor = (pathname: string, invites: PublicChatConfig["invites"]) =>
  invites
    .filter((i) => i.path && pathname.replace(/^\/(es|en)(?=\/|$)/, "").startsWith(i.path))
    .sort((a, b) => b.path.length - a.path.length)[0] ?? null;

/** Color de texto legible sobre un fondo (#rrggbb). */
export function readableOn(hex: string | null | undefined) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return l > 0.4 ? "#0b1020" : "#ffffff";
}

/* ---------------- Tiempo real ---------------- */

/** Presencia de los visitantes del sitio (sin datos personales salvo el nombre si ya está chateando). */
export const SITE_VISITORS_CHANNEL = "site-visitors";
export type VisitorPresence = {
  role: "visitor";
  page: string;
  title: string;
  locale: string;
  referrer: string | null;
  since: string;
  chatting: boolean;
  name: string | null;
};
/** Broadcast de un asesor a un visitante: muestra la invitación a chatear. */
export const VISITOR_INVITE_EVENT = "invite";
export type VisitorInvite = { key: string; agent: string };

/** Presencia de los asesores (canal AGENTS_CHANNEL de content/liveChat). */
export type AgentPresence = { role: "agent"; name: string; status: "available" | "busy" | "away" };

/* ---------------- Adjuntos ---------------- */

export const CHAT_FILES_BUCKET = "chat-files";
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
];

/** Ruta del archivo dentro del bucket: v/<tema secreto>/<aleatorio>-<nombre>. */
export const attachmentPath = (topic: string, fileName: string) => {
  const safe = fileName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .slice(-80);
  return `v/${topic}/${crypto.randomUUID()}-${safe || "archivo"}`;
};

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
