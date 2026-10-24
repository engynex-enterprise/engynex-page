import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fila de especificaciones de meta.com: icono pequeño, cifra en negrita y una
 * etiqueta corta, en columnas centradas.
 */
export function SpecRow({
  items,
  className,
}: {
  items: { icon: LucideIcon; value: string; label: string }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "mx-auto grid max-w-4xl grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4",
        className,
      )}
    >
      {items.map(({ icon: Icon, value, label }) => (
        <div key={label} className="flex flex-col items-center text-center">
          <Icon
            className="order-1 h-8 w-8 text-accent"
            strokeWidth={1.75}
            aria-hidden
          />
          {/* En el DOM el término va antes que su valor (dl válido); en
              pantalla la cifra se muestra primero. */}
          <dt className="order-3 mt-1 text-sm leading-snug text-muted">
            {label}
          </dt>
          <dd className="order-2 mt-4 text-2xl font-bold text-heading">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
