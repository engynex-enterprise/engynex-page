import Link from "next/link";
import { Logo } from "./Logo";
import { Container } from "./ui/Container";
import { RegionLanguage } from "./RegionLanguage";
import { CookieSettingsLink } from "./CookieSettingsLink";
import { InstagramIcon, FacebookIcon, TiktokIcon } from "./SocialIcons";
import { localizedHref, siteConfig } from "@/lib/site";
import { getService } from "@/content/services";
import { products, productCategories } from "@/content/products";
import { serviceGroups, aboutGroups } from "@/content/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

const socialLinks = [
  { href: siteConfig.social.instagram, label: "Instagram", Icon: InstagramIcon },
  { href: siteConfig.social.facebook, label: "Facebook", Icon: FacebookIcon },
  { href: siteConfig.social.tiktok, label: "TikTok", Icon: TiktokIcon },
];

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterGroup {
  title: string;
  links: FooterLink[];
}

/**
 * Footer al estilo de meta.com: fondo claro, logo y redes a la izquierda y,
 * a la derecha, columnas de enlaces con subtítulos en negrita. Abajo, el
 * selector de país e idioma ("Colombia (Español)") y la línea legal.
 *
 * Cubre todo lo que ofrece Engynex: los dieciséis servicios por función, los
 * productos por categoría, los planes, la empresa y la ayuda.
 */
export function Footer({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const f = dict.footer;
  const href = (path: string) => localizedHref(locale, path);
  const year = 2026;

  const serviceColumns: FooterGroup[] = serviceGroups.map((group) => ({
    title: group[locale].title,
    links: group.slugs.flatMap((slug) => {
      const service = getService(slug);
      return service
        ? [{ label: service[locale].title, href: href(`servicios/${slug}`) }]
        : [];
    }),
  }));

  const productGroups: FooterGroup[] = productCategories.map((category) => ({
    title: category[locale].title,
    links: products
      .filter((product) => product.category === category.key)
      .map((product) => ({
        label: product[locale].title,
        href: href(`productos/${product.slug}`),
      })),
  }));

  const plans: FooterGroup = {
    title: f.plansTitle,
    links: [
      { label: f.webPlans, href: href("planes#desarrollo-web") },
      { label: f.supportPlans, href: href("planes#soporte-ti") },
      { label: f.rentalPlans, href: href("planes#alquiler-equipos") },
    ],
  };

  const company: FooterGroup = {
    title: f.companyTitle,
    links: aboutGroups.flatMap((group) =>
      group.items.map((item) => ({
        label: item[locale].title,
        href: href(item.path),
      })),
    ),
  };

  const help: FooterGroup = {
    title: f.helpTitle,
    links: [
      { label: f.helpCenter, href: href("ayuda") },
      { label: f.techSupport, href: href("soporte") },
      { label: f.quote, href: href("cotizar") },
      {
        label: f.whatsapp,
        href: `https://wa.me/${siteConfig.whatsapp}`,
        external: true,
      },
    ],
  };

  const contact: FooterGroup = {
    title: f.contactTitle,
    links: [
      { label: siteConfig.email, href: `mailto:${siteConfig.email}` },
      {
        label: siteConfig.phoneDisplay,
        href: `tel:${siteConfig.phone.replace(/\s/g, "")}`,
      },
    ],
  };

  // Cuatro columnas; las de más de un grupo se apilan, como en meta.com.
  const columns: FooterGroup[][] = [
    [serviceColumns[0], serviceColumns[1]],
    [serviceColumns[2], plans],
    productGroups,
    [company, help, contact],
  ];

  return (
    <footer className="border-t border-line bg-surface text-body">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-16">
          {/* Marca */}
          <div>
            <Logo variant="adaptive" height={28} />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              {f.company}
            </p>
            <div className="mt-6 flex gap-2">
              {socialLinks.map(({ href: target, label, Icon }) => (
                <a
                  key={label}
                  href={target}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full text-heading transition-colors hover:bg-surface-soft"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <p className="mt-6 text-xs leading-relaxed text-muted">
              {siteConfig.hours[locale]}
            </p>
          </div>

          {/* Enlaces */}
          <nav
            aria-label={f.helpTitle}
            className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4"
          >
            {columns.map((stack, i) => (
              <div key={i} className="flex flex-col gap-10">
                {stack.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-sm text-heading">{group.title}</h3>
                    <ul className="mt-3 space-y-2.5">
                      {group.links.map((link) => (
                        <li key={link.href}>
                          {link.external || !link.href.startsWith("/") ? (
                            <a
                              href={link.href}
                              {...(link.external
                                ? { target: "_blank", rel: "noopener noreferrer" }
                                : {})}
                              className="break-words text-sm text-muted transition-colors hover:text-heading hover:underline"
                            >
                              {link.label}
                            </a>
                          ) : (
                            <Link
                              href={link.href}
                              className="text-sm text-muted transition-colors hover:text-heading hover:underline"
                            >
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Línea inferior: país e idioma + legal */}
        <div className="mt-14 grid gap-6 border-t border-line pt-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-16">
          <div>
            <RegionLanguage locale={locale} copy={dict.region} variant="text" />
          </div>
          <div className="space-y-2 text-xs leading-relaxed text-muted">
            <p>
              <span className="font-semibold text-heading">
                {siteConfig.name}
              </span>{" "}
              · {dict.contactPage.info.address}
            </p>
            <p className="flex flex-wrap gap-x-4 gap-y-1 font-semibold text-heading">
              <Link href={href("legal")} className="hover:underline">
                {f.legalCenter}
              </Link>
              <Link href={href("legal/terminos")} className="hover:underline">
                {f.legalTerms}
              </Link>
              <Link href={href("legal/privacidad")} className="hover:underline">
                {f.legalPrivacy}
              </Link>
              <Link href={href("legal/cookies")} className="hover:underline">
                {f.legalCookies}
              </Link>
              <CookieSettingsLink label={dict.cookies.footerLink} />
            </p>
            <p>
              © {year} {siteConfig.name}. {f.rights} ·{" "}
              <Link href={href("")} className="hover:text-heading hover:underline">
                {siteConfig.domain}
              </Link>{" "}
              · {f.madeWith}
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
