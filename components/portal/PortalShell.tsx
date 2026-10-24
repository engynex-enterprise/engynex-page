"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
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
  Plug,
  Search,
  Settings,
  UserCog,
  UserRound,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
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

interface NavItem {
  key: NavKey;
  path: string;
  icon: LucideIcon;
  group: Group;
  /** Roles que lo ven; sin lista, todos. */
  roles?: AppRole[];
}

const CHAT_ROLES: AppRole[] = ["admin", "sales", "support"];

/**
 * Módulos del portal, agrupados como en Meta Business Suite. Los permisos
 * reales los imponen las páginas (requireProfile) y la base de datos (RLS).
 */
const NAV: NavItem[] = [
  { key: "home", path: "", icon: Home, group: "main" },
  { key: "crm", path: "crm", icon: KanbanSquare, group: "sales", roles: ["admin", "sales", "marketing"] },
  { key: "chat", path: "chat", icon: MessagesSquare, group: "sales", roles: CHAT_ROLES },
  { key: "followups", path: "seguimiento", icon: MailCheck, group: "sales", roles: ["admin", "sales", "marketing"] },
  { key: "tasks", path: "tareas", icon: ListChecks, group: "sales", roles: ["admin", "sales", "support"] },
  { key: "agenda", path: "agenda", icon: CalendarDays, group: "sales", roles: ["admin", "sales"] },
  { key: "campaigns", path: "campanas", icon: Megaphone, group: "marketing", roles: ["admin", "marketing"] },
  { key: "analytics", path: "analitica", icon: BarChart3, group: "marketing", roles: ["admin", "marketing", "sales"] },
  { key: "reports", path: "reportes", icon: FileBarChart, group: "marketing", roles: ["admin", "sales", "marketing"] },
  { key: "support", path: "soporte", icon: Headset, group: "service", roles: ["admin", "support", "sales"] },
  { key: "accounts", path: "clientes", icon: Building2, group: "service", roles: ["admin", "sales", "support"] },
  { key: "tickets", path: "soporte", icon: LifeBuoy, group: "client", roles: ["client", "provider"] },
  { key: "documents", path: "documentos", icon: FolderOpen, group: "client", roles: ["client", "provider"] },
  { key: "automations", path: "automatizaciones", icon: Workflow, group: "admin", roles: ["admin", "sales", "marketing"] },
  { key: "integrations", path: "integraciones", icon: Plug, group: "admin", roles: ["admin"] },
  { key: "settings", path: "configuracion", icon: Settings, group: "admin", roles: ["admin"] },
  { key: "users", path: "usuarios", icon: UserCog, group: "admin", roles: ["admin"] },
];

const GROUP_ORDER: Group[] = ["main", "sales", "marketing", "service", "client", "admin"];

/* Menú contraído (solo iconos), recordado en el navegador. */
const COLLAPSE_KEY = "engynex-portal-nav";
const COLLAPSE_EVENT = "engynex-portal-nav-change";
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "collapsed";
  } catch {
    return false;
  }
};
const subscribeCollapsed = (cb: () => void) => {
  window.addEventListener(COLLAPSE_EVENT, cb);
  return () => window.removeEventListener(COLLAPSE_EVENT, cb);
};
const setCollapsedStored = (value: boolean) => {
  try {
    localStorage.setItem(COLLAPSE_KEY, value ? "collapsed" : "expanded");
  } catch {
    // Sin almacenamiento: vale solo para esta página.
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
};

/**
 * Marco del portal con el lenguaje de las herramientas de Meta (Business
 * Suite): barra superior blanca con buscador, ayuda, notificaciones y cuenta;
 * menú lateral agrupado y plegable; contenido sobre gris #F0F2F5.
 */
export function PortalShell({
  locale,
  profile,
  children,
}: {
  locale: Locale;
  profile: Pick<Profile, "id" | "full_name" | "email" | "role" | "kind">;
  children: React.ReactNode;
}) {
  const t = portalCopy[locale].portal;
  const s = shellCopy[locale];
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const accountRef = useRef<HTMLDivElement>(null);
  const base = `/${locale}/portal`;

  // Cerrar menús al navegar.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setAccountOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);
  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [accountOpen]);

  const items = NAV.filter((item) => !item.roles || item.roles.includes(profile.role));
  const href = (item: NavItem) => (item.path ? `${base}/${item.path}` : base);
  const isActive = (item: NavItem) => (item.path ? pathname.startsWith(href(item)) : pathname === base);
  const label = (item: NavItem) => t.nav[item.key];
  const name = profile.full_name ?? profile.email;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const navList = (compact: boolean) => (
    <nav aria-label={t.menu} className="flex flex-col gap-0.5">
      {GROUP_ORDER.map((group) => {
        const groupItems = items.filter((i) => i.group === group);
        if (groupItems.length === 0) return null;
        return (
          <div key={group} className={cn(group !== "main" && "mt-3 border-t border-line pt-3")}>
            {group !== "main" && !compact && (
              <p className="px-3 pb-1.5 text-[0.8rem] font-semibold text-muted">{s.groups[group]}</p>
            )}
            <ul className="grid gap-0.5">
              {groupItems.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <Link
                      href={href(item)}
                      aria-current={active ? "page" : undefined}
                      title={compact ? label(item) : undefined}
                      className={cn(
                        "relative flex h-10 items-center gap-3 rounded-md text-[0.94rem] transition-colors",
                        compact ? "justify-center px-0" : "px-3",
                        active ? "bg-[var(--meta-active)] font-semibold text-heading" : "text-heading hover:bg-[var(--meta-hover)]",
                      )}
                    >
                      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-accent" : "text-muted")} aria-hidden />
                      {!compact && <span className="min-w-0 flex-1 truncate">{label(item)}</span>}
                      {item.key === "chat" && chatUnread > 0 && (
                        <span
                          className={cn(
                            "grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[0.7rem] font-bold text-white",
                            compact && "absolute right-1.5 top-1",
                          )}
                        >
                          {chatUnread}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const pages = items.map((item) => ({ label: label(item), href: href(item), icon: item.icon }));

  return (
    <div className="portal-theme min-h-dvh bg-surface-soft text-body">
      {/* ---------------- Barra superior ---------------- */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 bg-surface px-2 shadow-[0_1px_2px_rgba(0,0,0,0.1)] sm:px-4 dark:bg-card">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t.menu}
          aria-expanded={mobileOpen}
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--meta-hover)] lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <Link href={base} className="flex shrink-0 items-center gap-2 px-1" aria-label="Engynex">
          <Logo variant="adaptive" height={22} />
          <span className="hidden rounded-md bg-card-soft px-2 py-0.5 text-xs font-bold text-heading sm:inline">{t.brand}</span>
        </Link>

        <div className="flex flex-1 justify-center px-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
            className="flex h-10 w-full max-w-md items-center gap-2 rounded-full bg-card-soft px-4 text-left text-[0.94rem] text-muted transition-colors hover:brightness-[0.97]"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{s.search}</span>
            <kbd className="hidden rounded border border-line-strong px-1.5 text-[0.7rem] sm:inline">Ctrl K</kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/${locale}/ayuda`}
            aria-label={s.help}
            title={s.help}
            className="hidden h-10 w-10 place-items-center rounded-full bg-card-soft text-heading hover:brightness-95 sm:grid"
          >
            <CircleHelp className="h-5 w-5" aria-hidden />
          </Link>
          <NotificationsBell locale={locale} userId={profile.id} />
          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              aria-expanded={accountOpen}
              aria-label={s.account}
              className="grid h-10 w-10 place-items-center rounded-full bg-deep-700 text-xs font-bold text-white ring-offset-2 ring-offset-surface hover:ring-2 hover:ring-line-strong dark:bg-white dark:text-deep-700"
            >
              {initials}
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-12 z-50 w-72 rounded-lg bg-surface p-2 shadow-[0_12px_28px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:bg-card">
                <div className="flex items-center gap-3 rounded-lg p-2">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-deep-700 text-sm font-bold text-white dark:bg-white dark:text-deep-700">
                    {initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.95rem] font-semibold text-heading">{name}</span>
                    <span className="block text-xs text-muted">{t.roleLabel[profile.role]}</span>
                  </span>
                </div>
                <div className="my-1 border-t border-line" />
                <Link href={`${base}/perfil`} className="flex h-11 items-center gap-3 rounded-md px-2 text-[0.94rem] text-heading hover:bg-[var(--meta-hover)]">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-card-soft"><UserRound className="h-5 w-5" aria-hidden /></span>
                  {t.nav.profile}
                </Link>
                <Link href={`/${locale}`} className="flex h-11 items-center gap-3 rounded-md px-2 text-[0.94rem] text-heading hover:bg-[var(--meta-hover)]">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-card-soft"><ExternalLink className="h-5 w-5" aria-hidden /></span>
                  {t.nav.site}
                </Link>
                <div className="flex h-11 items-center gap-3 rounded-md px-2 text-[0.94rem] text-heading">
                  <ThemeToggle label="Tema" tone="light" />
                </div>
                <form action={`/${locale}/auth/signout`} method="post">
                  <button type="submit" className="flex h-11 w-full items-center gap-3 rounded-md px-2 text-left text-[0.94rem] text-heading hover:bg-[var(--meta-hover)]">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-card-soft"><LogOut className="h-5 w-5" aria-hidden /></span>
                    {portalCopy[locale].userMenu.signOut}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- Menú lateral (escritorio) ---------------- */}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-14 z-30 hidden flex-col bg-surface shadow-[1px_0_2px_rgba(0,0,0,0.06)] transition-[width] lg:flex dark:bg-card",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">{navList(collapsed)}</div>
        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={() => setCollapsedStored(!collapsed)}
            aria-label={collapsed ? s.expand : s.collapse}
            title={collapsed ? s.expand : s.collapse}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-md text-[0.94rem] text-muted hover:bg-[var(--meta-hover)]",
              collapsed ? "justify-center" : "px-3",
            )}
          >
            {collapsed ? <ChevronsRight className="h-5 w-5" aria-hidden /> : <ChevronsLeft className="h-5 w-5" aria-hidden />}
            {!collapsed && s.collapse}
          </button>
        </div>
      </aside>

      {/* ---------------- Menú móvil ---------------- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label={portalCopy[locale].userMenu.close} onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/40" />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-2xl dark:bg-card">
            <div className="flex h-14 items-center justify-between px-3">
              <Logo variant="adaptive" height={22} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={portalCopy[locale].userMenu.close}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--meta-hover)]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">{navList(false)}</div>
          </aside>
        </div>
      )}

      {/* ---------------- Contenido ---------------- */}
      <main className={cn("pt-14 transition-[padding]", collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64")}>
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      <CommandPalette locale={locale} pages={pages} />
      {(profile.role === "admin" || profile.role === "sales") && <GreenLeadAlerts locale={locale} />}
      {CHAT_ROLES.includes(profile.role) && <ChatAlerts locale={locale} userId={profile.id} onUnread={setChatUnread} />}
    </div>
  );
}
