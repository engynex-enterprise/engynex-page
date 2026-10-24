"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RailCard {
  key: string;
  title: string;
  /** Línea corta bajo el título, abajo de la tarjeta. */
  caption?: string;
  image: string;
  href?: string;
}

/**
 * Carril horizontal de meta.com ("Explore the tech", "Gaming"…): tarjetas
 * fotográficas verticales con el título arriba a la izquierda, que se salen
 * por la derecha de la pantalla. Se recorre con scroll (con imán), con el dedo
 * o con las flechas, que se desactivan en los extremos.
 */
export function CardRail({
  cards,
  label,
  prevLabel,
  nextLabel,
}: {
  cards: RailCard[];
  /** Nombre accesible del carril. */
  label: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth > el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scrollBy = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div>
      <ul
        ref={trackRef}
        onScroll={update}
        aria-label={label}
        className="no-scrollbar flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto scroll-smooth px-4 sm:scroll-pl-8 sm:px-8 xl:scroll-pl-[max(2rem,calc((100vw-90rem)/2+2rem))] xl:px-[max(2rem,calc((100vw-90rem)/2+2rem))]"
      >
        {cards.map((card) => {
          const body = (
            <>
              <Image
                src={card.image}
                alt=""
                fill
                sizes="(max-width: 640px) 80vw, 22rem"
                className="-z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/0 to-black/50"
              />
              <h3 className="text-2xl leading-tight text-white">{card.title}</h3>
              {card.caption && (
                <p className="mt-auto text-sm leading-snug text-white/90">
                  {card.caption}
                </p>
              )}
            </>
          );
          const shell =
            "group relative isolate flex h-full flex-col overflow-hidden rounded-3xl bg-deep-800 p-6";
          return (
            <li
              key={card.key}
              className="aspect-[3/4] w-[78vw] shrink-0 snap-start sm:w-[20rem] lg:w-[22rem]"
            >
              {card.href ? (
                <Link href={card.href} className={shell}>
                  {body}
                </Link>
              ) : (
                <div className={shell}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex justify-center gap-2">
        <RailButton
          label={prevLabel}
          disabled={atStart}
          onClick={() => scrollBy(-1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </RailButton>
        <RailButton
          label={nextLabel}
          disabled={atEnd}
          onClick={() => scrollBy(1)}
        >
          <ChevronRight className="h-5 w-5" />
        </RailButton>
      </div>
    </div>
  );
}

function RailButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full bg-surface-soft text-heading transition-colors hover:bg-line",
        "disabled:cursor-default disabled:opacity-40 disabled:hover:bg-surface-soft",
      )}
    >
      {children}
    </button>
  );
}
