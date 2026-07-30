import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Backdrop } from "@/components/ui/Backdrop";
import { TechLogo } from "@/components/TechLogo";
import { technologies, techGroups } from "@/content/tech";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Tecnologías, agrupadas por capa.
 *
 * Una rejilla suelta de dieciséis logos solo dice "usamos muchas cosas".
 * Organizadas en filas —producto, backend, nube, comercio— la sección explica
 * de qué está hecho el trabajo, con el aire de una tabla de especificaciones.
 */
export function TechStrip({ copy }: { copy: Dictionary["techStrip"] }) {
  const rows = techGroups.map((key) => ({
    key,
    label: copy.groups[key],
    items: technologies.filter((tech) => tech.group === key),
  }));

  return (
    <section className="relative isolate overflow-hidden border-y border-line bg-surface-soft py-20 sm:py-24">
      <Backdrop variant="grid" />

      <Container className="relative">
        <SectionHeading
          eyebrow={copy.title}
          title={copy.subtitle}
          align="left"
        />

        <div className="mt-12 overflow-hidden rounded-3xl border border-line">
          {rows.map((row, r) => (
            <div
              key={row.key}
              className="grid gap-px bg-line sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]"
            >
              {/* Etiqueta de la capa */}
              <p className="flex items-center bg-card px-6 py-4 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-muted sm:py-6">
                {row.label}
              </p>

              {/* Logotipos de esa capa */}
              <ul className="flex flex-wrap items-center gap-x-8 gap-y-5 bg-card px-6 py-6">
                {row.items.map((tech, i) => (
                  <Reveal
                    key={tech.name}
                    as="li"
                    delay={(r * 2 + (i % 4)) * 45}
                    className="group flex items-center gap-2.5"
                  >
                    <TechLogo
                      tech={tech}
                      className="h-7 w-7 shrink-0 opacity-85 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
                    />
                    <span className="text-sm font-bold text-body transition-colors group-hover:text-heading">
                      {tech.name}
                    </span>
                  </Reveal>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
