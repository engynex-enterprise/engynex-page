import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Backdrop } from "@/components/ui/Backdrop";
import { TechLogo } from "@/components/TechLogo";
import { technologies } from "@/content/tech";

/**
 * Franja de tecnologías con sus logotipos.
 *
 * Es la única sección donde el color no es de marca: cada logo viene con su
 * propio color, y eso es precisamente lo que la hace legible de un vistazo.
 */
export function TechStrip({ title }: { title: string }) {
  return (
    <section className="relative isolate overflow-hidden border-y border-line bg-surface-soft py-14 sm:py-16">
      <Backdrop
        variant="grid"
      />
      <Container className="relative">
        <p className="text-center text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted">
          {title}
        </p>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {technologies.map((tech, i) => (
            <Reveal
              key={tech.name}
              as="li"
              delay={(i % 8) * 40}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-card px-3 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-card"
            >
              <TechLogo
                tech={tech}
                className="h-7 w-7 transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-center text-xs font-bold leading-tight text-body transition-colors group-hover:text-heading">
                {tech.name}
              </span>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
