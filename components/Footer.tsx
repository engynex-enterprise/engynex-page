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
import { products } from "@/content/products";
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
    <footer className="border-t border-line bg-surface-soft text-body">
      <Container className="py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_0.85fr_1.05fr]">
          {/* Marca */}
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <Logo variant="adaptive" />
            <p className="mt-5 text-sm leading-relaxed text-body">
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-body ring-1 ring-line-strong transition-colors hover:bg-card-soft hover:text-heading"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h3 className="text-sm font-medium text-heading">
              {dict.footer.servicesTitle}
            </h3>
            <ul className="mt-5 space-y-1 text-sm">
              {services.slice(0, 6).map((service) => (
                <li key={service.slug}>
                  <Link
                    href={localizedHref(locale, `servicios/${service.slug}`)}
                    className="inline-block py-1.5 transition-colors hover:text-heading"
                  >
                    {service[locale].title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Productos */}
          <div>
            <h3 className="text-sm font-medium text-heading">
              {dict.footer.productsTitle}
            </h3>
            <ul className="mt-5 space-y-1 text-sm">
              {products.slice(0, 6).map((product) => (
                <li key={product.slug}>
                  <Link
                    href={localizedHref(locale, `productos/${product.slug}`)}
                    className="inline-block py-1.5 transition-colors hover:text-heading"
                  >
                    {product[locale].title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-sm font-medium text-heading">
              {dict.footer.companyTitle}
            </h3>
            <ul className="mt-5 space-y-1 text-sm">
              {navRoutes.map((route) => (
                <li key={route.key}>
                  <Link
                    href={localizedHref(locale, route.path)}
                    className="inline-block py-1.5 transition-colors hover:text-heading"
                  >
                    {dict.nav[route.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-sm font-medium text-heading">
              {dict.footer.contactTitle}
            </h3>
            <ul className="mt-5 space-y-1 text-sm">
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="inline-flex items-center gap-2 py-1.5 transition-colors hover:text-heading"
                >
                  <Mail className="h-4 w-4 shrink-0 text-muted" />
                  <span className="break-all">{siteConfig.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${siteConfig.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 py-1.5 transition-colors hover:text-heading"
                >
                  <Phone className="h-4 w-4 shrink-0 text-muted" />
                  {siteConfig.phone}
                </a>
              </li>
              <li className="pt-2 text-muted">
                {dict.contactPage.info.address}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 text-xs text-muted sm:flex-row">
          <p>
            © {year} {siteConfig.name}. {dict.footer.rights}
          </p>
          <p className="flex items-center gap-4">
            <Link
              href={localizedHref(locale)}
              className="transition-colors hover:text-heading"
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
