import type { Locale } from "@/i18n/config";

const es = {
  groups: { sales: "Ventas", marketing: "Marketing", service: "Atención", client: "Tu cuenta", admin: "Configuración" },
  automations: "Automatizaciones",
  search: "Buscar en Engynex",
  searchPlaceholder: "Busca leads, conversaciones, solicitudes, clientes o páginas…",
  searchHint: "Escribe al menos 2 letras",
  searchEmpty: "Sin resultados para «{q}»",
  searchGroups: { pages: "Ir a", leads: "Leads", chats: "Conversaciones", tickets: "Solicitudes", accounts: "Clientes y proveedores" },
  searchKeys: "↑↓ para moverte · Enter para abrir · Esc para cerrar",
  collapse: "Contraer menú",
  expand: "Expandir menú",
  help: "Centro de ayuda",
  account: "Tu cuenta",
  notifications: {
    title: "Notificaciones",
    all: "Todas",
    unread: "No leídas",
    markAll: "Marcar todo como leído",
    empty: "No tienes notificaciones.",
    emptyUnread: "Estás al día.",
    open: "Abrir notificaciones",
  },
  ago: { now: "ahora", m: "hace {n} min", h: "hace {n} h", d: "hace {n} d" },
};

export type ShellCopy = typeof es;

const en: ShellCopy = {
  groups: { sales: "Sales", marketing: "Marketing", service: "Service", client: "Your account", admin: "Settings" },
  automations: "Automations",
  search: "Search Engynex",
  searchPlaceholder: "Search leads, conversations, requests, clients or pages…",
  searchHint: "Type at least 2 letters",
  searchEmpty: "No results for “{q}”",
  searchGroups: { pages: "Go to", leads: "Leads", chats: "Conversations", tickets: "Requests", accounts: "Clients and suppliers" },
  searchKeys: "↑↓ to move · Enter to open · Esc to close",
  collapse: "Collapse menu",
  expand: "Expand menu",
  help: "Help center",
  account: "Your account",
  notifications: {
    title: "Notifications",
    all: "All",
    unread: "Unread",
    markAll: "Mark all as read",
    empty: "You have no notifications.",
    emptyUnread: "You're all caught up.",
    open: "Open notifications",
  },
  ago: { now: "now", m: "{n} min ago", h: "{n} h ago", d: "{n} d ago" },
};

export const shellCopy: Record<Locale, ShellCopy> = { es, en };

/** "hace 5 min" a partir de una fecha ISO y la hora actual. */
export function timeAgo(t: ShellCopy, iso: string, now: number) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return t.ago.now;
  if (s < 3600) return t.ago.m.replace("{n}", String(Math.floor(s / 60)));
  if (s < 86400) return t.ago.h.replace("{n}", String(Math.floor(s / 3600)));
  return t.ago.d.replace("{n}", String(Math.floor(s / 86400)));
}
