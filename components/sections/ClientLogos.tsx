import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ClientLogo } from "@/components/ClientLogo";
import { clients } from "@/content/clients";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Franja de clientes.
 *
 * A la izquierda el enunciado con la cifra; a la derecha un muro de logotipos
 * sobre retícula: cada marca ocupa su celda y las separa una línea de un píxel
 * (`gap-px` sobre fondo `line`, que evita los bordes dobles de usar `border`).
 *
 * La retícula es lo que hace que el bloque se lea como un muro deliberado y no
 * como marcas sueltas flotando. Van todas en la misma tinta —sin color propio—
 * porque un muro monocromo se percibe más ordenado y no compite con el resto
 * de la página.
 */
export function ClientLogos({
  clients: copy,
}: {
  clients: Dictionary["clients"];
}) {
  // Doce marcas en cuatro filas de tres: con celdas más anchas ningún
  // nombre parte en dos líneas.
  const wall = clients.slice(0, 12);

  return (
    <section className="isolate border-y border-line bg-surface-soft py-20 sm:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)] lg:items-center lg:gap-16">
          {/* Enunciado */}
          <div>
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <h2 className="mt-5 text-balance text-2xl font-extrabold text-heading sm:text-3xl">
              {copy.title}
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-body">
              {copy.subtitle}
            </p>

            <p className="mt-9 flex items-baseline gap-4 border-t border-line pt-7">
              <span className="font-display text-4xl font-extrabold leading-none text-heading">
                {copy.count}
              </span>
              <span className="max-w-48 text-sm leading-snug text-muted">
                {copy.countLabel}
              </span>
            </p>
          </div>

          {/* Muro de logotipos */}
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            {wall.map((client, i) => (
              <Reveal
                key={client.name}
                as="li"
                delay={(i % 3) * 60}
                className="group flex h-24 items-center justify-center bg-card px-5 transition-colors duration-300 hover:bg-accent-soft/40 sm:h-26"
              >
                <ClientLogo
                  client={client}
                  className="text-sm text-heading/40 transition-all duration-300 group-hover:scale-[1.04] group-hover:text-heading lg:text-[0.95rem]"
                />
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
