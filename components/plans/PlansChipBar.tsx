"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface PlansChip {
  id: string;
  label: string;
}

/** Distancia desde arriba (navbar de 64 px + esta barra) que marca la sección activa. */
const ACTIVE_OFFSET = 160;

/**
 * Barra de chips pegada bajo la navegación, como los filtros de las páginas
 * de tienda de meta.com: un chip por grupo de servicios que salta a su
 * ancla. El chip del grupo visible se pinta como píldora marino; en móvil
 * la fila se desplaza en horizontal y mantiene el chip activo a la vista.
 */
export function PlansChipBar({
  chips,
  label,
  action,
}: {
  chips: PlansChip[];
  /** Nombre accesible de la navegación. */
  label: string;
  action: { label: string; href: string };
}) {
  const [active, setActive] = useState<string | null>(null);
  const railRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const chip of chips) {
        const el = document.getElementById(chip.id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) {
          current = chip.id;
        }
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [chips]);

  // Mantiene el chip activo visible dentro de la fila (sin mover la página).
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !active) return;
    const chip = rail.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!chip) return;
    const left = chip.offsetLeft - rail.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < rail.scrollLeft || right > rail.scrollLeft + rail.clientWidth) {
      rail.scrollTo({ left: Math.max(0, left - 16), behavior: "smooth" });
    }
  }, [active]);

  return (
    <div className="sticky top-16 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
      <Container className="flex h-16 items-center gap-4">
        <nav aria-label={label} className="min-w-0 flex-1">
          <ul
            ref={railRef}
            className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {chips.map((chip) => {
              const isActive = active === chip.id;
              return (
                <li key={chip.id} className="shrink-0">
                  <a
                    href={`#${chip.id}`}
                    data-chip={chip.id}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-action",
                      isActive
                        ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700"
                        : "bg-surface-soft text-heading hover:bg-card-soft dark:bg-white/10 dark:hover:bg-white/15",
                    )}
                  >
                    {chip.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="hidden shrink-0 sm:block">
          <Link href={action.href} className={buttonClasses("primary", "md")}>
            {action.label}
          </Link>
        </div>
      </Container>
    </div>
  );
}
