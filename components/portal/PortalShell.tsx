"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ExternalLink,
  Home,
  KanbanSquare,
  ListChecks,
  Megaphone,
  MessagesSquare,
  FolderOpen,
  Headset,
  Building2,
  LifeBuoy,
  Plug,
  MailCheck,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  UserCog,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GreenLeadAlerts } from "@/components/crm/GreenLeadAlerts";
import { ChatAlerts } from "@/components/chat/ChatAlerts";
import type { AppRole, Profile } from "@/lib/supabase/types";
import { portalCopy } from "@/content/portal";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type NavKey = keyof (typeof portalCopy)["es"]["portal"]["nav"];

interface NavItem {
  key: Exclude<NavKey, "site">;
  path: string;
  icon: LucideIcon;
  /** Roles que lo ven; sin lista, todos. */
  roles?: AppRole[];
}

/**
 * Módulos del portal. Cada fase agrega los suyos aquí (CRM, analítica,
 * chat, campañas…), con los roles que pueden verlos. Los permisos reales los
 * imponen las páginas (requireProfile) y la base de datos (RLS).
 */
const CHAT_ROLES: AppRole[] = ["admin", "sales", "support"];

export const portalNav: NavItem[] = [
  { key: "home", path: "", icon: Home },
  { key: "crm", path: "crm", icon: KanbanSquare, roles: ["admin", "sales", "marketing"] },
  { key: "tickets", path: "soporte", icon: LifeBuoy, roles: ["client", "provider"] },
  { key: "documents", path: "documentos", icon: FolderOpen, roles: ["client", "provider"] },
  { key: "chat", path: "chat", icon: MessagesSquare, roles: CHAT_ROLES },
  { key: "support", path: "soporte", icon: Headset, roles: ["admin", "support", "sales"] },
  { key: "accounts", path: "clientes", icon: Building2, roles: ["admin", "sales", "support"] },
  { key: "campaigns", path: "campanas", icon: Megaphone, roles: ["admin", "marketing"] },
  { key: "followups", path: "seguimiento", icon: MailCheck, roles: ["admin", "sales", "marketing"] },
  { key: "reports", path: "reportes", icon: FileBarChart, roles: ["admin", "sales", "marketing"] },
  { key: "analytics", path: "analitica", icon: BarChart3, roles: ["admin", "marketing", "sales"] },
  { key: "tasks", path: "tareas", icon: ListChecks, roles: ["admin", "sales", "support"] },
  { key: "agenda", path: "agenda", icon: CalendarDays, roles: ["admin", "sales"] },
  { key: "settings", path: "configuracion", icon: Settings, roles: ["admin"] },
  { key: "integrations", path: "integraciones", icon: Plug, roles: ["admin"] },
  { key: "users", path: "usuarios", icon: UserCog, roles: ["admin"] },
  { key: "profile", path: "perfil", icon: UserRound },
];

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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const base = `/${locale}/portal`;

  // Cerrar el menú móvil al navegar.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const items = portalNav.filter(
    (item) => !item.roles || item.roles.includes(profile.role),
  );
  const name = profile.full_name ?? profile.email;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const nav = (
    <nav aria-label={t.menu} className="flex h-full flex-col">
      <ul className="grid gap-1">
        {items.map(({ key, path, icon: Icon }) => {
          const href = path ? `${base}/${path}` : base;
          const active = path ? pathname.startsWith(href) : pathname === base;
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors",
                  active
                    ? "bg-surface-soft font-bold text-heading dark:bg-white/[0.08]"
                    : "text-body hover:bg-surface-soft hover:text-heading dark:hover:bg-white/[0.05]",
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active && "text-accent")} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{t.nav[key]}</span>
                {key === "chat" && chatUnread > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[0.7rem] font-bold text-white">
                    {chatUnread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto grid gap-1 border-t border-line pt-4">
        <Link
          href={`/${locale}`}
          className="flex h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] text-body hover:bg-surface-soft hover:text-heading dark:hover:bg-white/[0.05]"
        >
          <ExternalLink className="h-5 w-5 shrink-0" aria-hidden />
          {t.nav.site}
        </Link>
        <form action={`/${locale}/auth/signout`} method="post">
          <button
            type="submit"
            className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.95rem] text-body hover:bg-surface-soft hover:text-heading dark:hover:bg-white/[0.05]"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
            {portalCopy[locale].userMenu.signOut}
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-surface-soft">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-5 lg:flex dark:bg-deep-950">
        <Link href={base} className="mb-8 flex items-center gap-2 px-2" aria-label="Engynex">
          <Logo variant="adaptive" height={24} />
          <span className="rounded-full bg-surface-soft px-2 py-0.5 text-xs font-bold text-heading dark:bg-white/10">
            {t.brand}
          </span>
        </Link>
        {nav}
      </aside>

      {/* Menú móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={portalCopy[locale].userMenu.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface px-4 py-5 shadow-2xl dark:bg-deep-950">
            <div className="mb-8 flex items-center justify-between px-2">
              <Logo variant="adaptive" height={24} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={portalCopy[locale].userMenu.close}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-card-soft"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur-md sm:px-6 dark:bg-deep-950/90">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t.menu}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-card-soft lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle label="Tema" tone="light" />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold leading-tight text-heading">{name}</p>
              <p className="text-xs text-muted">{t.roleLabel[profile.role]}</p>
            </div>
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-full bg-deep-700 text-xs font-bold text-white dark:bg-white dark:text-deep-700"
            >
              {initials}
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
        {(profile.role === "admin" || profile.role === "sales") && (
          <GreenLeadAlerts locale={locale} />
        )}
        {CHAT_ROLES.includes(profile.role) && (
          <ChatAlerts locale={locale} userId={profile.id} onUnread={setChatUnread} />
        )}
      </div>
    </div>
  );
}
