"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  CircleHelp,
  ExternalLink,
  FileBarChart,
  FolderOpen,
  Headset,
  Home,
  KanbanSquare,
  LifeBuoy,
  ListChecks,
  LogOut,
  MailCheck,
  Megaphone,
  Menu,
  MessagesSquare,
  MoreHorizontal,
  Plug,
  Search,
  Settings,
  UserCog,
  UserPlus,
  UserRound,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GreenLeadAlerts } from "@/components/crm/GreenLeadAlerts";
import { ChatAlerts } from "@/components/chat/ChatAlerts";
import { NotificationsBell } from "./NotificationsBell";
import { CommandPalette, OPEN_SEARCH_EVENT } from "./CommandPalette";
import type { AppRole, Profile } from "@/lib/supabase/types";
import { portalCopy } from "@/content/portal";
import { shellCopy } from "@/content/shell";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type NavKey = Exclude<keyof (typeof portalCopy)["es"]["portal"]["nav"], "site">;
type Group = keyof (typeof shellCopy)["es"]["groups"] | "main";
type Counter = "chat" | "tickets" | "tasks";

interface NavItem {
  key: NavKey;
  path: string;
  icon: LucideIcon;
  group: Group;
  /** Roles que lo ven; sin lista, todos. */
  roles?: AppRole[];
  counter?: Counter;
}

const CHAT_ROLES: AppRole[] = ["admin", "sales", "support"];

/**
 * Módulos del portal agrupados en secciones plegables. Los permisos reales
 * los imponen las páginas (requireProfile) y la base de datos (RLS).
 */
const NAV: NavItem[] = [
  { key: "home", path: "", icon: Home, group: "main" },
  { key: "crm", path: "crm", icon: KanbanSquare, group: "sales", roles: ["admin", "sales", "marketing"] },
  { key: "chat", path: "chat", icon: MessagesSquare, group: "sales", roles: CHAT_ROLES, counter: "chat" },
  { key: "followups", path: "seguimiento", icon: MailCheck, group: "sales", roles: ["admin", "sales", "marketing"] },
  { key: "tasks", path: "tareas", icon: ListChecks, group: "sales", roles: ["admin", "sales", "support"], counter: "tasks" },
  { key: "agenda", path: "agenda", icon: CalendarDays, group: "sales", roles: ["admin", "sales"] },
  { key: "campaigns", path: "campanas", icon: Megaphone, group: "marketing", roles: ["admin", "marketing"] },
  { key: "analytics", path: "analitica", icon: BarChart3, group: "marketing", roles: ["admin", "marketing", "sales"] },
  { key: "reports", path: "reportes", icon: FileBarChart, group: "marketing", roles: ["admin", "sales", "marketing"] },
  { key: "support", path: "soporte", icon: Headset, group: "service", roles: ["admin", "support", "sales"], counter: "tickets" },
  { key: "accounts", path: "clientes", icon: Building2, group: "service", roles: ["admin", "sales", "support"] },
  { key: "tickets", path: "soporte", icon: LifeBuoy, group: "client", roles: ["client", "provider"] },
  { key: "documents", path: "documentos", icon: FolderOpen, group: "client", roles: ["client", "provider"] },
  { key: "automations", path: "automatizaciones", icon: Workflow, group: "admin", roles: ["admin", "sales", "marketing"] },
  { key: "integrations", path: "integraciones", icon: Plug, group: "admin", roles: ["admin"] },
  { key: "settings", path: "configuracion", icon: Settings, group: "admin", roles: ["admin"] },
  { key: "users", path: "usuarios", icon: UserCog, group: "admin", roles: ["admin"] },
];

const GROUP_ORDER: Group[] = ["main", "sales", "marketing", "service", "client", "admin"];

/* Secciones plegadas, recordadas en el navegador. */
const FOLD_KEY = "engynex-portal-folded";
const FOLD_EVENT = "engynex-portal-folded-change";
const readFolded = () => {
  try {
    return localStorage.getItem(FOLD_KEY) ?? "";
  } catch {
    return "";
  }
};
const subscribeFolded = (cb: () => void) => {
  window.addEventListener(FOLD_EVENT, cb);
  return () => window.removeEventListener(FOLD_EVENT, cb);
};
const toggleFolded = (group: string) => {
  const set = new Set(readFolded().split(",").filter(Boolean));
  if (set.has(group)) set.delete(group);
  else set.add(group);
  try {
    localStorage.setItem(FOLD_KEY, [...set].join(","));
  } catch {
    // Sin almacenamiento: vale solo para esta página.
  }
  window.dispatchEvent(new Event(FOLD_EVENT));
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/**
 * Marco del portal con el diseño de CRM de referencia: barra lateral gris
 * claro (espacio de trabajo, buscador con "/", secciones plegables con
 * contadores y tarjeta de usuario) y área blanca con encabezado de página
 * (título, ayuda, configuración, notificaciones, equipo e "Invitar").
 */
export function PortalShell({
  locale,
  profile,
  team,
  counts,
  children,
}: {
  locale: Locale;
  profile: Pick<Profile, "id" | "full_name" | "email" | "role" | "kind">;
  team: { id: string; name: string }[];
  counts: { tickets: number; tasks: number };
  children: React.ReactNode;
}) {
  const t = portalCopy[locale].portal;
  const s = shellCopy[locale];
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const folded = useSyncExternalStore(subscribeFolded, readFolded, () => "");
  const userRef = useRef<HTMLDivElement>(null);
  const base = `/${locale}/portal`;
  const employee = profile.kind === "employee";

  // Cerrar menús al navegar.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setUserMenu(false);
  }
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);
  useEffect(() => {
    if (!userMenu) return;
    const onDown = (event: PointerEvent) => {
      if (!userRef.current?.contains(event.target as Node)) setUserMenu(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [userMenu]);

  const items = NAV.filter((item) => !item.roles || item.roles.includes(profile.role));
  const href = (item: NavItem) => (item.path ? `${base}/${item.path}` : base);
  const isActive = (item: NavItem) => (item.path ? pathname.startsWith(href(item)) : pathname === base);
  const label = (item: NavItem) => t.nav[item.key];
  const current = items.find(isActive);
  const name = profile.full_name ?? profile.email;
  const counter = (c?: Counter) => (c === "chat" ? chatUnread : c === "tickets" ? counts.tickets : c === "tasks" ? counts.tasks : 0);
  const foldedSet = new Set(folded.split(",").filter(Boolean));

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Espacio de trabajo */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-deep-700 shadow-sm">
          <Image src="/images/logos/favico.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        </span>
        <Link href={base} className="min-w-0 flex-1">
          <span className="block truncate text-[0.95rem] font-semibold text-heading">Engynex</span>
          <span className="block truncate text-xs text-muted">
            {s.workspace} · {employee ? t.roleLabel[profile.role] : t.kindLabel[profile.kind]}
          </span>
        </Link>
        <Link href={`/${locale}`} aria-label={t.nav.site} title={t.nav.site} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading">
          <ChevronsUpDown className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {/* Buscador */}
      <div className="px-4 pb-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
          className="flex h-10 w-full items-center gap-2.5 rounded-[10px] bg-[#efeff1] px-3 text-left text-sm text-muted transition-colors hover:bg-[#e8e8eb] dark:bg-white/[0.06] dark:hover:bg-white/[0.09]"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">{s.search.split(" ")[0]}</span>
          <kbd className="grid h-5 min-w-5 place-items-center rounded-md border border-line-strong bg-surface px-1 text-[0.7rem] font-semibold text-muted">/</kbd>
        </button>
      </div>

      {/* Navegación */}
      <nav aria-label={t.menu} className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {GROUP_ORDER.map((group) => {
          const groupItems = items.filter((i) => i.group === group);
          if (groupItems.length === 0) return null;
          const isFolded = group !== "main" && foldedSet.has(group);
          return (
            <div key={group} className="mt-3 first:mt-1">
              {group !== "main" && (
                <button
                  type="button"
                  onClick={() => toggleFolded(group)}
                  aria-expanded={!isFolded}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted hover:text-heading"
                >
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isFolded && "-rotate-90")} aria-hidden />
                  {s.groups[group]}
                </button>
              )}
              {!isFolded && (
                <ul className="mt-0.5 grid gap-0.5">
                  {groupItems.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;
                    const n = counter(item.counter);
                    return (
                      <li key={item.key}>
                        <Link
                          href={href(item)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[0.92rem] transition-colors",
                            active
                              ? "bg-surface font-semibold text-heading shadow-[0_1px_2px_rgba(16,24,40,0.08),0_0_0_1px_rgba(16,24,40,0.04)]"
                              : "text-body hover:bg-[#efeff1] hover:text-heading dark:hover:bg-white/[0.06]",
                          )}
                        >
                          <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-heading" : "text-muted")} strokeWidth={1.8} aria-hidden />
                          <span className="min-w-0 flex-1 truncate">{label(item)}</span>
                          {n > 0 && (
                            <span className="grid h-5 min-w-5 place-items-center rounded-md border border-line-strong bg-surface px-1.5 text-[0.7rem] font-semibold tabular-nums text-heading">
                              {n > 99 ? "99+" : n}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Usuario */}
      <div ref={userRef} className="relative border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-[10px] p-1.5">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-deep-700 text-xs font-bold text-white dark:bg-white dark:text-deep-700">
            {initialsOf(name)}
            <span aria-hidden className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[var(--sidebar)]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.92rem] font-semibold text-heading">{name}</span>
            <span className="block truncate text-xs text-muted">{profile.email}</span>
          </span>
          <button
            type="button"
            onClick={() => setUserMenu((v) => !v)}
            aria-expanded={userMenu}
            aria-label={s.more}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--meta-hover)] hover:text-heading"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {userMenu && (
          <div className="absolute bottom-full left-3 right-3 z-50 mb-2 rounded-xl bg-surface p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.25),0_0_0_1px_rgba(16,24,40,0.06)] dark:bg-card">
            <Link href={`${base}/perfil`} className="flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm text-heading hover:bg-[var(--meta-hover)]">
              <UserRound className="h-4 w-4 text-muted" aria-hidden />
              {t.nav.profile}
            </Link>
            <Link href={`/${locale}`} className="flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm text-heading hover:bg-[var(--meta-hover)]">
              <ExternalLink className="h-4 w-4 text-muted" aria-hidden />
              {t.nav.site}
            </Link>
            <div className="flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm text-heading">
              <ThemeToggle label="Tema" tone="light" />
            </div>
            <form action={`/${locale}/auth/signout`} method="post">
              <button type="submit" className="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left text-sm text-red-600 hover:bg-[var(--meta-hover)]">
                <LogOut className="h-4 w-4" aria-hidden />
                {portalCopy[locale].userMenu.signOut}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  const pages = items.map((item) => ({ label: label(item), href: href(item), icon: item.icon }));
  const iconButton = "grid h-9 w-9 place-items-center rounded-full text-heading transition-colors hover:bg-[var(--meta-hover)]";

  return (
    <div className="portal-theme min-h-dvh bg-surface text-body">
      {/* Barra lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17.5rem] border-r border-line bg-[var(--sidebar)] lg:block">{sidebar}</aside>

      {/* Barra lateral (celular) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label={portalCopy[locale].userMenu.close} onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/40" />
          <aside className="absolute inset-y-0 left-0 w-[17.5rem] bg-[var(--sidebar)] shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label={portalCopy[locale].userMenu.close}
              className="absolute right-2 top-3 z-10 grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--meta-hover)]"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-[17.5rem]">
        {/* Encabezado de página */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={t.menu}
            aria-expanded={mobileOpen}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--meta-hover)] lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <div id="portal-title-slot" className="portal-title-slot flex min-w-0 flex-1 items-baseline gap-2">
            <span className="portal-title-fallback truncate text-xl font-semibold text-heading">{current ? label(current) : ""}</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/${locale}/ayuda`} aria-label={s.help} title={s.help} className={cn(iconButton, "hidden sm:grid")}>
              <CircleHelp className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            </Link>
            {profile.role === "admin" && (
              <Link href={`${base}/configuracion`} aria-label={s.settings} title={s.settings} className={cn(iconButton, "hidden sm:grid")}>
                <Settings className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </Link>
            )}
            <NotificationsBell locale={locale} userId={profile.id} />
          </div>
          {employee && team.length > 0 && (
            <Link href={profile.role === "admin" ? `${base}/usuarios` : base} aria-label={s.team} title={s.team} className="ml-1 hidden items-center md:flex">
              {team.slice(0, 4).map((m, i) => (
                <span
                  key={m.id}
                  title={m.name}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full border-2 border-surface text-[0.7rem] font-bold text-white",
                    ["bg-deep-700", "bg-brand-green-dark", "bg-sky-600", "bg-violet-600"][i % 4],
                    i > 0 && "-ml-2.5",
                  )}
                >
                  {initialsOf(m.name)}
                </span>
              ))}
              {team.length > 4 && (
                <span className="-ml-2.5 grid h-9 w-9 place-items-center rounded-full border-2 border-surface bg-[var(--meta-active)] text-[0.7rem] font-bold text-accent">
                  +{team.length - 4}
                </span>
              )}
            </Link>
          )}
          {profile.role === "admin" && (
            <Link
              href={`${base}/usuarios`}
              className="ml-2 hidden h-10 items-center gap-2 rounded-[10px] bg-action px-4 text-sm font-semibold text-deep-700 transition-colors hover:bg-action-hover sm:inline-flex"
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              {s.invite}
            </Link>
          )}
        </header>

        <main className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6">{children}</main>
      </div>

      <CommandPalette locale={locale} pages={pages} />
      {(profile.role === "admin" || profile.role === "sales") && <GreenLeadAlerts locale={locale} />}
      {CHAT_ROLES.includes(profile.role) && <ChatAlerts locale={locale} userId={profile.id} name={profile.full_name ?? profile.email} onUnread={setChatUnread} />}
    </div>
  );
}
