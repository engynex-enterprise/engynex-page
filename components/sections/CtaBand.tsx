import { MediaTile } from "@/components/ui/MediaTile";
import { Container } from "@/components/ui/Container";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";

/**
 * Cierre de página: una tarjeta fotográfica a todo el ancho, igual que las
 * piezas destacadas de meta.com, con la afirmación y las dos acciones.
 */
export function CtaBand({
  locale,
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: {
  locale: Locale;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="bg-surface py-8 sm:py-12">
      <Container>
        <MediaTile
          size="wide"
          image="/images/cta-bg.jpg"
          title={title}
          description={subtitle}
          primary={{
            label: primaryLabel,
            href: primaryHref ?? localizedHref(locale, "contacto"),
          }}
          secondary={
            secondaryLabel
              ? {
                  label: secondaryLabel,
                  href: secondaryHref ?? localizedHref(locale, "portafolio"),
                }
              : undefined
          }
        />
      </Container>
    </section>
  );
}
