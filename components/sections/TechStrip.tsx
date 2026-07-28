import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Backdrop } from "@/components/ui/Backdrop";
import { TechLogo } from "@/components/TechLogo";
import { technologies } from "@/content/tech";

/**
 * Franja de tecnologías.
 *
 * Mismo lenguaje de retícula que el muro de clientes —celdas separadas por una
 * línea de un píxel dentro de un contenedor con borde—, pero a todo el ancho y
 * con los logotipos en su color de marca: aquí el color sí es información.
 */
export function TechStrip({ title }: { title: string }) {
  return (
    <section className="relative isolate overflow-hidden border-y border-line bg-surface-soft py-20 sm:py-24">
      <Backdrop variant="grid" />

      <Container className="relative">
        <div className="flex items-center gap-6">
          <Eyebrow>{title}</Eyebrow>
          <span aria-hidden className="h-px flex-1 bg-line" />
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4 lg:grid-cols-8">
          {technologies.map((tech, i) => (
            <Reveal
              key={tech.name}
              as="li"
              delay={(i % 8) * 40}
              className="group flex h-28 flex-col items-center justify-center gap-3 bg-card px-3 transition-colors duration-300 hover:bg-accent-soft/40"
            >
              <TechLogo
                tech={tech}
                className="h-7 w-7 opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
              />
              <span className="text-center text-xs font-bold leading-tight text-muted transition-colors group-hover:text-heading">
                {tech.name}
              </span>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
