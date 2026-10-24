"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type TocItem = { id: string; title: string };

/**
 * Índice del documento. En escritorio es una columna fija (sticky) que
 * resalta la sección visible; en móvil se pliega en un desplegable.
 */
export function LegalToc({
  items,
  title,
  label,
}: {
  items: TocItem[];
  title: string;
  label: string;
}) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!sections.length) return;

    // La sección activa es la última cuyo inicio ya pasó bajo la barra
    // superior; al llegar al final de la página, la última.
    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      let current = sections[0].id;
      if (atBottom) current = sections[sections.length - 1].id;
      else
        for (const section of sections) {
          if (section.getBoundingClientRect().top <= 140) current = section.id;
          else break;
        }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  const closeDisclosure = (event: MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.closest("details")?.removeAttribute("open");
  };

  const list = (onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void) => (
    <ol className="space-y-1">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={onNavigate}
              aria-current={isActive ? "location" : undefined}
              className={cn(
                "block rounded-lg border-l-2 py-1.5 pl-3 pr-2 text-sm leading-snug transition-colors",
                isActive
                  ? "border-heading font-semibold text-heading"
                  : "border-transparent text-muted hover:text-heading",
              )}
            >
              {item.title}
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Escritorio */}
      <nav
        aria-label={label}
        className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto pb-8 lg:block"
      >
        <p className="mb-3 pl-3 text-xs font-bold uppercase tracking-wider text-muted">
          {title}
        </p>
        {list()}
      </nav>

      {/* Móvil */}
      <details className="group rounded-2xl bg-surface-soft lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-heading [&::-webkit-details-marker]:hidden">
          {title}
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <nav aria-label={label} className="px-3 pb-4">
          {/* Cierra el desplegable al elegir una sección. */}
          {list(closeDisclosure)}
        </nav>
      </details>
    </>
  );
}
