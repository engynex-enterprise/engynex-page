import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ClientLogo } from "@/components/ClientLogo";
import { clients } from "@/content/clients";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Franja de clientes.
 *
 * Un enunciado corto y centrado y, debajo, las marcas en una sola tinta gris
 * sin cajas ni retícula: el muro se lee ordenado por la alineación, no por las
 * líneas. Monocromo a propósito, para no competir con el resto de la página.
 */
export function ClientLogos({
  clients: copy,
}: {
  clients: Dictionary["clients"];
}) {
  // Doce marcas: dos filas de seis en escritorio.
  const wall = clients.slice(0, 12);

  return (
    <section className="isolate border-y border-line bg-surface-soft py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 className="mt-3 text-balance text-2xl font-medium text-heading sm:text-3xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-sm text-muted">
            <span className="font-medium text-heading">{copy.count}</span>{" "}
            {copy.countLabel}
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {wall.map((client, i) => (
            <Reveal
              key={client.name}
              as="li"
              delay={(i % 6) * 40}
              className="group flex h-12 items-center justify-center px-2"
            >
              <ClientLogo
                client={client}
                className="text-sm text-heading/45 transition-colors duration-300 group-hover:text-heading lg:text-[0.95rem]"
              />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
