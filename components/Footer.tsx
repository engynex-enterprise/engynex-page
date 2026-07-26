import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { Container } from "./ui/Container";
import {
  InstagramIcon,
  FacebookIcon,
  TiktokIcon,
} from "./SocialIcons";
import { navRoutes, localizedHref, siteConfig } from "@/lib/site";
import { services } from "@/content/services";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

const socialLinks = [
  { href: siteConfig.social.instagram, label: "Instagram", Icon: InstagramIcon },
  { href: siteConfig.social.facebook, label: "Facebook", Icon: FacebookIcon },
  { href: siteConfig.social.tiktok, label: "TikTok", Icon: TiktokIcon },
];

export function Footer({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const year = 2026;

  return (
    <footer className="relative overflow-hidden bg-navy-950 text-ink-300">
      {/* Figuras vectoriales decorativas (cubren todo el footer) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 opacity-[0.18]" />
        <div className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-brand-green/10 blur-[120px]" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-brand-blue/12 blur-[120px]" />

        {/* Swoosh verde estilo logo */}
        <svg
          className="absolute -top-10 right-0 h-64 w-[45rem] text-brand-green/10"
          viewBox="0 0 700 260"
          fill="none"
        >
          <path
            d="M0 230 C 220 40, 480 40, 700 4"
            stroke="currentColor"
            strokeWidth="26"
            strokeLinecap="round"
          />
        </svg>

        {/* Esfera / anillos (motivo del ícono) */}
        <svg
          className="animate-spin-slow absolute -bottom-28 -left-24 h-96 w-96 text-white/[0.05]"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="94" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="100" cy="100" rx="94" ry="42" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="100" cy="100" rx="42" ry="94" stroke="currentColor" strokeWidth="1.5" />
          <line x1="6" y1="100" x2="194" y2="100" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        {/* Puntos */}
        <svg
          className="absolute right-[8%] top-[38%] h-24 w-24 text-brand-green/20"
          viewBox="0 0 80 80"
        >
          <g fill="currentColor">
            {[8, 24, 40, 56, 72].map((y) =>
              [8, 24, 40, 56, 72].map((x) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" />
              )),
            )}
          </g>
        </svg>

        {/* Cruces / plus */}
        <svg
          className="animate-float absolute left-[45%] top-[16%] h-8 w-8 text-brand-blue-light/25"
          viewBox="0 0 100 100"
        >
          <path
            d="M50 14v72M14 50h72"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <Container className="relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Marca */}
          <div className="max-w-sm">
            <Logo variant="white" />
            <p className="mt-5 text-sm leading-relaxed text-ink-300">
              {dict.footer.tagline}
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-ink-200 ring-1 ring-white/10 transition-all hover:bg-brand-green hover:text-navy-950 hover:ring-brand-green"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              {dict.footer.servicesTitle}
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {services.slice(0, 6).map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`${localizedHref(locale, "servicios")}#${service.slug}`}
                    className="transition-colors hover:text-brand-green-light"
                  >
                    {service[locale].title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              {dict.footer.companyTitle}
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {navRoutes.map((route) => (
                <li key={route.key}>
                  <Link
                    href={localizedHref(locale, route.path)}
                    className="transition-colors hover:text-brand-green-light"
                  >
                    {dict.nav[route.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
              {dict.footer.contactTitle}
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="inline-flex items-center gap-2 transition-colors hover:text-brand-green-light"
                >
                  <Mail className="h-4 w-4 text-brand-green" />
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${siteConfig.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-brand-green-light"
                >
                  <Phone className="h-4 w-4 text-brand-green" />
                  {siteConfig.phone}
                </a>
              </li>
              <li className="pt-1 text-ink-400">
                {dict.contactPage.info.address}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-ink-400 sm:flex-row">
          <p>
            © {year} {siteConfig.name}. {dict.footer.rights}
          </p>
          <p className="flex items-center gap-4">
            <Link
              href={localizedHref(locale)}
              className="transition-colors hover:text-ink-200"
            >
              {siteConfig.domain}
            </Link>
            <span aria-hidden>·</span>
            <span>{dict.footer.madeWith}</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
