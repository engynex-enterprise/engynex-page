import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Barra de producto de meta.com: justo bajo el hero, con el nombre a la
 * izquierda y el precio de arranque y la acción a la derecha. Se queda pegada
 * bajo la barra de navegación (64 px) mientras se recorre la ficha.
 */
export function StickyBar({
  title,
  priceLabel,
  price,
  action,
}: {
  title: string;
  /** "Desde" / "Starting at". */
  priceLabel?: string;
  price?: string;
  action: { label: string; href: string };
}) {
  return (
    <div className="sticky top-16 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <p className="truncate text-lg font-bold text-heading sm:text-xl">
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-4">
          {price && (
            <p className="hidden text-right leading-tight sm:block">
              {priceLabel && (
                <span className="block text-sm text-muted">{priceLabel}</span>
              )}
              <span className="block text-base font-bold text-heading">
                {price}
              </span>
            </p>
          )}
          <Link href={action.href} className={buttonClasses("primary", "md")}>
            {action.label}
          </Link>
        </div>
      </Container>
    </div>
  );
}
