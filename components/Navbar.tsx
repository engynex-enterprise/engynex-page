"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ArrowRight,
  Clock,
  Mail,
  ChevronDown,
  Phone,
  Sparkles,
} from "lucide-react";
import { Logo } from "./Logo";
import { InstagramIcon, FacebookIcon, TiktokIcon } from "./SocialIcons";
import { RegionLanguage } from "./RegionLanguage";
import { ThemeToggle } from "./ThemeToggle";
import { Container } from "./ui/Container";
import { buttonClasses } from "./ui/Button";
import { iconRegistry, fallbackIcon } from "./icons";
import { navRoutes, localizedHref, siteConfig } from "@/lib/site";
import type { MegaMenu, MenuItem, MenuPanel } from "@/lib/menu";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type PanelKey = MenuPanel["key"];

/** Alto de la subcabecera (px). */
const TOPBAR_HEIGHT = 40;

/** Rutas de la barra que abren un panel del mega menú. */
const panelForRoute: Partial<Record<string, PanelKey>> = {
  services: "services",
  products: "products",
  about: "about",
};

export function Navbar({
  locale,
  nav,
  themeLabel,
  menu,
  region,
}: {
  locale: Locale;
  nav: Dictionary["nav"];
  themeLabel: string;
  menu: MegaMenu;
  region: Dictionary["region"];
}) {
  const pathname = usePathname() || `/${locale}`;
  const [scrolled, setScrolled] = useState(false);
  /**
   * Distancia de la barra principal al borde superior. Empieza bajo la
   * subcabecera (que va en el flujo normal) y sube con el scroll hasta quedar
   * pegada arriba, así las páginas solo reservan los 64 px de la barra.
   */
  const [headerTop, setHeaderTop] = useState(TOPBAR_HEIGHT);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);
  const [mobileSection, setMobileSection] = useState<PanelKey | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      setHeaderTop(Math.max(0, TOPBAR_HEIGHT - window.scrollY));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloquea el scroll del body solo con el menú móvil abierto.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Cierra todo al cambiar de ruta (evita que el menú quede abierto y el
  // scroll bloqueado tras navegar desde el logo o cualquier enlace).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setMobileSection(null);
    setOpenPanel(null);
  }

  // Escape cierra el panel abierto.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenPanel(null);
      setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // El mega menú abre y cierra solo con clic. Un clic fuera de la cabecera
  // (o en cualquier punto que no sea el panel abierto) lo cierra.
  useEffect(() => {
    if (openPanel === null) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && headerRef.current?.contains(target)) return;
      setOpenPanel(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openPanel]);

  const togglePanel = useCallback(
    (key: PanelKey) =>
      setOpenPanel((current) => (current === key ? null : key)),
    [],
  );

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileSection(null);
  };


  const isActive = (path: string) => {
    const href = localizedHref(locale, path);
    return path === "" ? pathname === href : pathname.startsWith(href);
  };


  const socials = [
    { href: siteConfig.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: siteConfig.social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: siteConfig.social.tiktok, label: "TikTok", Icon: TiktokIcon },
  ];

  return (
    <>
    {/* Subcabecera: horario, contacto y redes. Va en el flujo normal de la
        página, encima de la barra principal, y se va con el scroll. */}
    <div
      className="relative z-50 bg-deep-950 text-white/80"
      style={{ height: TOPBAR_HEIGHT }}
    >
      <Container className="flex h-full items-center justify-between gap-3 text-xs font-medium">
        <span className="hidden items-center gap-1.5 truncate whitespace-nowrap sm:inline-flex">
          <Clock className="h-3.5 w-3.5 shrink-0 text-brand-green" />
          <span className="hidden lg:inline">{siteConfig.hours[locale]}</span>
          <span className="inline lg:hidden">
            {locale === "es"
              ? "Lun–Vie 7–17 · Sáb 8–16"
              : "Mon–Fri 7–17 · Sat 8–16"}
          </span>
        </span>
        <div className="flex flex-1 items-center justify-end gap-1">
          <a
            href={`mailto:${siteConfig.email}`}
            className="mr-2 hidden items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white lg:inline-flex"
          >
            <Mail className="h-3.5 w-3.5 text-brand-green" />
            {siteConfig.email}
          </a>
          <a
            href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
            className="mr-1 inline-flex h-8 items-center gap-1.5 whitespace-nowrap px-1 transition-colors hover:text-white"
          >
            <Phone className="h-3.5 w-3.5 text-brand-green" />
            <span>{siteConfig.phoneDisplay}</span>
          </a>
          <span aria-hidden className="mx-1 hidden h-4 w-px bg-white/20 sm:block" />
          {socials.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </Container>
    </div>

    <header
      ref={headerRef}
      className="fixed inset-x-0 z-50"
      style={{ top: headerTop }}
    >
      {/* Fila principal + paneles del mega menú: barra blanca de 64 px, como
          en meta.com. El contacto y las redes viven en el footer. */}
      <div
        className={cn(
          "relative border-b bg-white transition-colors duration-300 dark:bg-deep-950",
          scrolled || openPanel !== null ? "border-line" : "border-transparent",
        )}
      >
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo y navegación juntos a la izquierda, como en meta.com */}
            <div className="flex min-w-0 items-center gap-6 xl:gap-10">
            <Link
              href={localizedHref(locale)}
              aria-label="Engynex Colombia"
              className="shrink-0"
              onClick={closeMobile}
            >
              {/* Logo más pequeño en pantallas estrechas para que la barra no
                  desborde (el `!` gana al alto en línea del componente). */}
              <Logo
                variant="adaptive"
                height={28}
                className="h-6! w-auto sm:h-7!"
              />
            </Link>

            {/* Navegación desktop */}
            <nav className="hidden items-center gap-1 lg:flex xl:gap-2">
              {navRoutes.map((route) => {
                const panelKey = panelForRoute[route.key];
                const active = isActive(route.path);
                const itemClass = cn(
                  "inline-flex h-10 items-center gap-1 rounded-full px-2.5 text-[0.95rem] text-heading transition-colors hover:bg-card-soft dark:hover:bg-white/5 xl:px-3",
                  active && "font-semibold",
                );

                if (!panelKey) {
                  return (
                    <Link
                      key={route.key}
                      href={localizedHref(locale, route.path)}
                      className={itemClass}
                    >
                      {nav[route.key]}
                    </Link>
                  );
                }

                const expanded = openPanel === panelKey;
                return (
                  <button
                    key={route.key}
                    type="button"
                    id={`mega-trigger-${panelKey}`}
                    aria-expanded={expanded}
                    aria-controls={`mega-panel-${panelKey}`}
                    onClick={() => togglePanel(panelKey)}
                    className={cn(itemClass, expanded && "bg-card-soft")}
                  >
                    {nav[route.key]}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        expanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </nav>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Utilidades, como "Ayuda" y el globo de idioma en meta.com */}
              <Link
                href={localizedHref(locale, "ayuda")}
                className="hidden h-10 items-center rounded-full px-3 text-[0.95rem] text-heading transition-colors hover:bg-card-soft xl:inline-flex dark:hover:bg-white/5"
              >
                {region.help}
              </Link>
              <RegionLanguage
                locale={locale}
                copy={region}
                className="hidden sm:inline-flex"
              />
              <ThemeToggle label={themeLabel} tone="light" />
              {/* El wrapper evita mezclar `hidden` con el `inline-flex` del
                  botón: en móvil el CTA desbordaba la barra. */}
              <div className="hidden sm:block">
                <Link
                  href={localizedHref(locale, "contacto")}
                  className={buttonClasses("primary", "md")}
                >
                  {nav.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Botón menú móvil */}
              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                aria-label={mobileOpen ? nav.closeMenu : nav.openMenu}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-deep-900 transition-colors hover:bg-deep-900/5 lg:hidden dark:text-white dark:hover:bg-white/10"
              >
                {mobileOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </Container>

        {/* Paneles del mega menú (solo desktop) */}
        {menu.map((panel) => (
          <MegaPanel
            key={panel.key}
            panel={panel}
            open={openPanel === panel.key}
            onNavigate={() => setOpenPanel(null)}
          />
        ))}
      </div>

      {/* Menú móvil */}
      <div
        id="mobile-menu"
        className={cn(
          "overflow-hidden border-deep-900/10 bg-white transition-[max-height,opacity] duration-300 ease-in-out lg:hidden dark:border-white/10 dark:bg-deep-950",
          mobileOpen
            ? "max-h-[calc(100dvh-4.5rem)] border-t opacity-100"
            : "max-h-0 border-t-0 opacity-0",
        )}
      >
        <div className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain">
          <Container className="py-4">
            <nav className="flex flex-col gap-1">
              {navRoutes.map((route) => {
                const panelKey = panelForRoute[route.key];
                const panel = panelKey
                  ? menu.find((item) => item.key === panelKey)
                  : undefined;
                const active = isActive(route.path);

                if (!panel) {
                  return (
                    <Link
                      key={route.key}
                      href={localizedHref(locale, route.path)}
                      onClick={closeMobile}
                      className={cn(
                        "rounded-2xl px-4 py-3 text-base font-medium transition-colors",
                        active
                          ? "bg-surface-soft text-heading"
                          : "text-deep-800 hover:bg-deep-900/5 dark:text-ink-200 dark:hover:bg-white/5",
                      )}
                    >
                      {nav[route.key]}
                    </Link>
                  );
                }

                const expanded = mobileSection === panel.key;
                return (
                  <div key={route.key}>
                    <button
                      type="button"
                      onClick={() =>
                        setMobileSection((current) =>
                          current === panel.key ? null : panel.key,
                        )
                      }
                      aria-expanded={expanded}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium transition-colors",
                        active || expanded
                          ? "bg-surface-soft text-heading"
                          : "text-deep-800 hover:bg-deep-900/5 dark:text-ink-200 dark:hover:bg-white/5",
                      )}
                    >
                      {nav[route.key]}
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 transition-transform duration-200",
                          expanded && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </button>

                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        expanded
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-4 px-1 pb-3 pt-2">
                          {panel.columns.map((column) => (
                            <div key={column.key}>
                              <p className="px-3 text-sm font-medium text-muted">
                                {column.title}
                              </p>
                              <ul className="mt-1">
                                {column.items.map((item) => (
                                  <li key={item.href}>
                                    <MenuLink
                                      item={item}
                                      onNavigate={closeMobile}
                                      compact
                                    />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          <Link
                            href={panel.href}
                            onClick={closeMobile}
                            className="mx-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent"
                          >
                            {panel.viewAllLabel}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="mt-4 flex flex-col gap-3 border-t border-deep-900/10 pt-4 dark:border-white/10">
              <Link
                href={localizedHref(locale, "contacto")}
                onClick={closeMobile}
                className={buttonClasses("primary", "md", "w-full")}
              >
                {nav.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex items-center justify-between gap-3">
                <RegionLanguage
                  locale={locale}
                  copy={region}
                  onDone={closeMobile}
                />
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                  className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-heading transition-colors hover:text-accent"
                >
                  <Phone className="h-4 w-4 text-accent" />
                  {siteConfig.phoneDisplay}
                </a>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </header>
    </>
  );
}

function MegaPanel({
  panel,
  open,
  onNavigate,
}: {
  panel: MenuPanel;
  open: boolean;
  onNavigate: () => void;
}) {
  return (
    <div
      id={`mega-panel-${panel.key}`}
      aria-labelledby={`mega-trigger-${panel.key}`}
      className={cn(
        "absolute inset-x-0 top-full hidden transition-all duration-200 ease-out lg:block",
        open
          ? "visible translate-y-0 opacity-100"
          : "pointer-events-none invisible -translate-y-2 opacity-0",
      )}
    >
      <Container>
        <div className="mt-2 max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain rounded-3xl border border-deep-900/10 bg-white shadow-2xl shadow-deep-900/25 dark:border-white/10 dark:bg-deep-900">
          <div className="grid gap-x-6 gap-y-7 p-6 lg:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_18rem] xl:p-7">
            {panel.columns.map((column) => (
              <div key={column.key}>
                <p className="px-2.5 text-sm font-medium text-muted">
                  {column.title}
                </p>
                <ul className="mt-2 space-y-0.5">
                  {column.items.map((item) => (
                    <li key={item.href}>
                      <MenuLink item={item} onNavigate={onNavigate} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Tarjeta destacada */}
            <div className="relative overflow-hidden rounded-3xl bg-surface-soft p-6 lg:col-span-3 xl:col-span-1">
              <div className="relative flex h-full flex-col">
                <span className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  {panel.featured.eyebrow}
                </span>
                <p className="mt-3 text-xl font-medium leading-snug text-heading">
                  {panel.featured.title}
                </p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {panel.featured.desc}
                </p>
                <Link
                  href={panel.featured.ctaHref}
                  onClick={onNavigate}
                  className={buttonClasses("primary", "md", "mt-5 w-full")}
                >
                  {panel.featured.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-deep-900/10 bg-slate-50/80 px-7 py-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-sm text-slate-500 dark:text-ink-400">
              {panel.tagline}
            </p>
            <Link
              href={panel.href}
              onClick={onNavigate}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              {panel.viewAllLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

function MenuLink({
  item,
  onNavigate,
  compact = false,
}: {
  item: MenuItem;
  onNavigate: () => void;
  compact?: boolean;
}) {
  const Icon = iconRegistry[item.icon] ?? fallbackIcon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-surface-soft dark:hover:bg-white/5"
    >
      <span
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-soft text-accent transition-colors duration-200 group-hover:bg-card dark:text-accent",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium leading-tight text-heading">
            {item.title}
          </span>
          {item.badge && (
            <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-[0.68rem] font-semibold text-heading">
              {item.badge}
            </span>
          )}
        </span>
        <span
          className={cn(
            // sin `block`: chocaría con el display de line-clamp
            "mt-0.5 text-xs leading-snug text-slate-500 dark:text-ink-400",
            compact ? "line-clamp-1" : "line-clamp-2",
          )}
        >
          {item.desc}
        </span>
      </span>
    </Link>
  );
}
