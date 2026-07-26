import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/i18n/dictionaries";

export function ClientLogos({ clients }: { clients: Dictionary["clients"] }) {
  return (
    <section className="border-b border-navy-900/10 bg-white py-14 dark:border-white/10 dark:bg-navy-950">
      <Container>
        <p className="text-center text-sm font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-ink-400">
          {clients.title}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
          {clients.names.map((name) => (
            <span
              key={name}
              className="font-display text-2xl font-extrabold text-navy-900/30 transition-colors duration-300 hover:text-navy-900/70 sm:text-3xl dark:text-white/25 dark:hover:text-white/70"
            >
              {name}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
