"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, Clock, Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { InstagramIcon, FacebookIcon, TiktokIcon } from "./SocialIcons";
import { Container } from "./ui/Container";
import { buttonClasses } from "./ui/Button";
import { navRoutes, localizedHref, siteConfig } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export function Navbar({
  locale,
  nav,
  themeLabel,
}: {
  locale: Locale;
  nav: Dictionary["nav"];
  themeLabel: string;
}) {
  const pathname = usePathname() || `/${locale}`;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloquea el scroll del body con el menú abierto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const closeMenu = () => setOpen(false);
  const solid = scrolled || open;

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
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Barra superior: horario, contacto y redes */}
      <div
        className={cn(
          "overflow-hidden bg-navy-950/85 text-ink-200 backdrop-blur transition-all duration-300",
          scrolled
            ? "max-h-0 border-transparent opacity-0"
            : "max-h-14 border-b border-white/10 opacity-100",
        )}
      >
        <Container>
          <div className="flex h-10 items-center justify-between gap-4 text-xs font-semibold">
            <div className="flex items-center gap-4 truncate">
              <span className="hidden items-center gap-1.5 whitespace-nowrap sm:inline-flex">
                <Clock className="h-3.5 w-3.5 text-brand-green" />
                <span className="hidden lg:inline">
                  {siteConfig.hours[locale]}
                </span>
                <span className="inline lg:hidden">
                  {locale === "es"
                    ? "Lun–Vie 7–17 · Sáb 8–16"
                    : "Mon–Fri 7–17 · Sat 8–16"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`mailto:${siteConfig.email}`}
                className="hidden items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white lg:inline-flex"
              >
                <Mail className="h-3.5 w-3.5 text-brand-green" />
                {siteConfig.email}
              </a>
              <a
                href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white"
              >
                <Phone className="h-3.5 w-3.5 text-brand-green" />
                <span>{siteConfig.phoneDisplay}</span>
              </a>
              <span className="hidden h-4 w-px bg-white/15 sm:block" />
              <div className="flex items-center gap-1.5">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-brand-green hover:text-navy-950"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Fila principal */}
      <div
        className={cn(
          "transition-all duration-300",
          solid
            ? "border-b border-navy-900/10 bg-white/85 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70 dark:border-white/10 dark:bg-navy-950/85 dark:supports-[backdrop-filter]:bg-navy-950/70"
            : "border-b border-transparent bg-transparent",
        )}
      >
      <Container>
        <div className="flex h-18 items-center justify-between gap-4">
          <Link
            href={localizedHref(locale)}
            aria-label="Engynex Colombia"
            className="shrink-0"
          >
            <Logo variant={solid ? "adaptive" : "white"} height={34} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navRoutes.map((route) => (
              <Link
                key={route.key}
                href={localizedHref(locale, route.path)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  solid
                    ? isActive(route.path)
                      ? "text-brand-green-dark dark:text-brand-green"
                      : "text-navy-700 hover:text-brand-green-dark dark:text-ink-200 dark:hover:text-brand-green"
                    : isActive(route.path)
                      ? "text-brand-green-light"
                      : "text-ink-200 hover:text-white",
                )}
              >
                {nav[route.key]}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle label={themeLabel} tone={solid ? "light" : "dark"} />
            <div className="hidden sm:block">
              <LanguageSwitcher locale={locale} tone={solid ? "light" : "dark"} />
            </div>
            <div className="hidden sm:block">
              <Link
                href={localizedHref(locale, "contacto")}
                className={buttonClasses("primary", "md")}
              >
                {nav.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? nav.closeMenu : nav.openMenu}
              aria-expanded={open}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors lg:hidden",
                solid
                  ? "text-navy-900 hover:bg-navy-900/5 dark:text-white dark:hover:bg-white/10"
                  : "text-white hover:bg-white/10",
              )}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </Container>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-navy-900/10 bg-white lg:hidden dark:border-white/10 dark:bg-navy-950",
          "transition-[max-height,opacity] duration-300 ease-in-out",
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <Container className="py-5">
          <nav className="flex flex-col gap-1">
            {navRoutes.map((route) => (
              <Link
                key={route.key}
                href={localizedHref(locale, route.path)}
                onClick={closeMenu}
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-bold transition-colors",
                  isActive(route.path)
                    ? "bg-brand-green/10 text-brand-green-dark dark:text-brand-green"
                    : "text-navy-800 hover:bg-navy-900/5 dark:text-ink-200 dark:hover:bg-white/5",
                )}
              >
                {nav[route.key]}
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex items-center justify-between gap-3">
            <LanguageSwitcher
              locale={locale}
              tone="light"
              onNavigate={closeMenu}
            />
            <Link
              href={localizedHref(locale, "contacto")}
              onClick={closeMenu}
              className={cn(buttonClasses("primary", "md"), "flex-1")}
            >
              {nav.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </div>
    </header>
  );
}
