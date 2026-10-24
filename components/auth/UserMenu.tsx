"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  LogOut,
  Truck,
  User,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AccountKind, AppRole } from "@/lib/supabase/types";
import { buttonClasses } from "@/components/ui/Button";
import { portalCopy } from "@/content/portal";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const kindIcons: Record<AccountKind, LucideIcon> = {
  client: UserRound,
  provider: Truck,
  employee: Briefcase,
};
const KINDS: AccountKind[] = ["client", "provider", "employee"];

interface SessionInfo {
  name: string;
  email: string;
  kind: AccountKind;
  role: AppRole;
}

/**
 * Icono de usuario de la barra. Sin sesión abre "Acceder a Engynex" con tres
 * opciones (cliente, proveedor, empleado); con sesión muestra quién está
 * conectado, el acceso al portal y cerrar sesión.
 */
export function UserMenu({ locale }: { locale: Locale }) {
  const t = portalCopy[locale].userMenu;
  const roles = portalCopy[locale].portal.roleLabel;
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Sesión actual (y cambios: entrar o salir en otra pestaña).
  useEffect(() => {
    const supabase = createClient();
    const load = async (userId: string | undefined) => {
      if (!userId) return setSession(null);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, kind, role")
        .eq("id", userId)
        .single();
      if (data)
        setSession({
          name: data.full_name ?? data.email,
          email: data.email,
          kind: data.kind,
          role: data.role,
        });
    };
    supabase.auth.getUser().then(({ data }) => load(data.user?.id));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      void load(s?.user.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target))
        return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  const initials = session?.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="user-menu-panel"
        aria-label={session ? `${t.signedInAs} ${session.name}` : t.button}
        title={session ? session.name : t.button}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 transition-colors",
          session
            ? "bg-deep-700 text-xs font-bold text-white ring-deep-700 dark:bg-white dark:text-deep-700 dark:ring-white"
            : open
              ? "bg-deep-700 text-white ring-deep-700 dark:bg-white dark:text-deep-700"
              : "bg-deep-900/5 text-deep-700 ring-deep-900/10 hover:bg-deep-900/10 hover:text-deep-900 dark:bg-white/5 dark:text-ink-200 dark:ring-white/15 dark:hover:bg-white/10",
        )}
      >
        {session ? initials : <User className="h-5 w-5" aria-hidden />}
      </button>

      <div
        ref={panelRef}
        id="user-menu-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        hidden={!open}
        className="fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-3xl bg-surface text-heading shadow-[0_24px_70px_-20px_rgba(11,16,32,0.5)] ring-1 ring-line md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-3 md:w-[22rem] dark:bg-card"
      >
        <div className="flex items-start justify-between gap-3 px-6 pb-4 pt-6">
          {session ? (
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-deep-700 text-sm font-bold text-white dark:bg-white dark:text-deep-700">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted">{t.signedInAs}</p>
                <h2 id={titleId} className="truncate text-lg leading-tight text-heading">
                  {session.name}
                </h2>
                <p className="truncate text-xs text-muted">
                  {session.email} · {roles[session.role]}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 id={titleId} className="text-lg leading-tight text-heading">
                {t.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
            </div>
          )}
          <button
            type="button"
            onClick={close}
            aria-label={t.close}
            className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-card-soft"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {session ? (
            <div className="grid gap-2">
              <Link
                href={`/${locale}/portal`}
                onClick={() => setOpen(false)}
                className={buttonClasses("primary", "md", "w-full")}
              >
                {t.goPortal}
              </Link>
              <form action={`/${locale}/auth/signout`} method="post">
                <button type="submit" className={buttonClasses("outline", "md", "w-full")}>
                  <LogOut className="h-4 w-4" aria-hidden />
                  {t.signOut}
                </button>
              </form>
            </div>
          ) : (
            <ul className="grid gap-2">
              {KINDS.map((kind) => {
                const Icon = kindIcons[kind];
                return (
                  <li key={kind}>
                    <Link
                      href={`/${locale}/acceso?as=${kind}`}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-3 rounded-2xl border border-line px-4 py-3.5 transition-colors hover:bg-surface-soft"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-soft text-accent dark:bg-white/[0.06]">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-heading">
                          {t.kinds[kind].title}
                        </span>
                        <span className="block text-xs text-muted">{t.kinds[kind].desc}</span>
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
