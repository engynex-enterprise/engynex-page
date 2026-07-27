import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ClientLogo } from "@/components/ClientLogo";
import { clients, featuredClients } from "@/content/clients";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Franja de clientes: grid con las marcas más reconocidas y, debajo, un
 * marquee infinito con el resto (empresas medianas y locales).
 */
export function ClientLogos({
  clients: copy,
  locale,
}: {
  clients: Dictionary["clients"];
  locale: Locale;
}) {
  const rest = clients.filter((client) => !client.featured);
  // Se duplica la lista para que el marquee (translateX -50%) cicle sin salto.
  const marquee = [...rest, ...rest];

  return (
    <section className="relative overflow-hidden border-y border-line bg-surface py-16 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-dots absolute inset-0 opacity-[0.35]" />
        <div className="absolute left-1/2 top-0 h-56 w-[42rem] -translate-x-1/2 rounded-full bg-brand-green/[0.07] blur-[110px] dark:bg-brand-green/10" />
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-accent">
            {copy.eyebrow}
          </span>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-heading sm:text-3xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-body">
            {copy.subtitle}
          </p>
        </div>

        {/* Marcas destacadas */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {featuredClients.map((client, i) => (
            <Reveal
              key={client.name}
              delay={(i % 5) * 60}
              className="group flex h-24 flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-card px-3 text-center transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/40 hover:shadow-card"
            >
              <ClientLogo
                client={client}
                className="text-base text-heading/45 transition-colors duration-300 group-hover:text-heading sm:text-lg"
              />
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {client[locale].sector}
              </span>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Empresas medianas y locales — marquee */}
      <div className="group relative mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="animate-marquee-slow flex w-max items-center gap-12 group-hover:[animation-play-state:paused] sm:gap-16">
          {marquee.map((client, i) => (
            <ClientLogo
              key={`${client.name}-${i}`}
              client={client}
              className="text-base text-heading/30 transition-colors duration-300 hover:text-heading/70"
            />
          ))}
        </div>
      </div>

      <Container className="relative">
        <p className="mt-10 text-center text-xs font-semibold text-muted">
          {copy.note}
        </p>
      </Container>
    </section>
  );
}
