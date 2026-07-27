import Image from "next/image";
import type { Client, ClientMark, ClientType } from "@/content/clients";
import { cn } from "@/lib/utils";

/** Tratamiento tipográfico del nombre según el estilo declarado. */
const typeClasses: Record<ClientType, string> = {
  sans: "font-sans font-extrabold tracking-tight",
  wide: "font-sans font-bold uppercase tracking-[0.16em] text-[0.82em]",
  tight: "font-sans font-black tracking-[-0.035em]",
  display: "font-display font-bold tracking-tight",
};

function Mark({ mark, initials }: { mark: ClientMark; initials: string }) {
  const label = (
    <span className="text-[0.58em] font-black leading-none">{initials}</span>
  );

  switch (mark) {
    case "square":
      return (
        <span className="grid h-[1.6em] w-[1.6em] shrink-0 place-items-center rounded-[0.4em] bg-current">
          <span className="text-[0.58em] font-black leading-none text-surface">
            {initials}
          </span>
        </span>
      );
    case "circle":
      return (
        <span className="grid h-[1.6em] w-[1.6em] shrink-0 place-items-center rounded-full bg-current">
          <span className="text-[0.58em] font-black leading-none text-surface">
            {initials}
          </span>
        </span>
      );
    case "ring":
      return (
        <span className="grid h-[1.6em] w-[1.6em] shrink-0 place-items-center rounded-full ring-[0.14em] ring-current ring-inset">
          {label}
        </span>
      );
    case "chevron":
      return (
        <svg
          viewBox="0 0 32 32"
          className="h-[1.6em] w-[1.6em] shrink-0"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 22c6-12 12-16 24-18"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M4 30c4-6 8-9 15-11"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      );
    case "bars":
      return (
        <span
          className="flex h-[1.6em] w-[1.6em] shrink-0 items-end gap-[0.14em]"
          aria-hidden
        >
          <span className="h-[45%] w-[0.26em] rounded-[0.1em] bg-current opacity-50" />
          <span className="h-[75%] w-[0.26em] rounded-[0.1em] bg-current opacity-75" />
          <span className="h-full w-[0.26em] rounded-[0.1em] bg-current" />
        </span>
      );
  }
}

/**
 * Logotipo tipográfico de un cliente.
 *
 * Si la marca tiene un archivo real (`client.logo`) se usa ese; si no, se
 * genera un wordmark monocromo (monograma + nombre) que hereda el color del
 * contenedor, para que toda la franja se vea como un mismo sistema visual.
 */
export function ClientLogo({
  client,
  className,
}: {
  client: Client;
  className?: string;
}) {
  if (client.logo) {
    return (
      <Image
        src={client.logo}
        alt={client.name}
        width={160}
        height={44}
        className={cn("h-9 w-auto object-contain", className)}
      />
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-2.5 text-xl", className)}
      title={client.name}
    >
      <Mark mark={client.mark} initials={client.initials} />
      <span className={cn("whitespace-nowrap", typeClasses[client.type])}>
        {client.name}
      </span>
    </span>
  );
}
