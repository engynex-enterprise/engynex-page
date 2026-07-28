import { Container } from "@/components/ui/Container";
import { ClientLogo } from "@/components/ClientLogo";
import { clients } from "@/content/clients";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Franja de clientes.
 *
 * Una sola rejilla de logotipos monocromos, sin tarjetas ni marquee: el
 * patrón que usan las grandes plataformas. Los logos se apagan al 40% y se
 * encienden al pasar el cursor, así la franja no compite con el contenido.
 */
export function ClientLogos({ clients: copy }: { clients: Dictionary["clients"] }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-surface-soft py-16 sm:py-20">
      <Container className="relative">
        <p className="text-center text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted">
          {copy.title}
        </p>

        <ul className="mt-12 grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {clients.slice(0, 15).map((client) => (
            <li key={client.name} className="flex min-w-0 justify-center">
              <ClientLogo
                client={client}
                className="text-xs text-heading/40 transition-colors duration-300 hover:text-heading sm:text-sm lg:text-base"
              />
            </li>
          ))}
        </ul>

        <p className="mt-12 text-center text-sm text-muted">{copy.note}</p>
      </Container>
    </section>
  );
}
