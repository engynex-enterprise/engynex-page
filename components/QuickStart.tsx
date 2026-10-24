import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Fila previa al footer, como "Get news and updates" de meta.com: un rótulo a
 * la izquierda y un campo de correo con su botón. Envía por GET a /contacto,
 * donde el formulario recibe el correo ya escrito (`?email=`), así que
 * funciona sin JavaScript.
 */
export function QuickStart({
  locale,
  copy,
}: {
  locale: Locale;
  copy: Dictionary["quickStart"];
}) {
  return (
    <section className="border-t border-line bg-surface py-12 sm:py-16">
      <Container className="grid gap-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-12">
        <h2 className="text-lg leading-snug text-heading">{copy.title}</h2>
        <div>
          <form
            action={localizedHref(locale, "contacto")}
            method="get"
            className="flex flex-col gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="quickstart-email">
              {copy.label}
            </label>
            <input
              id="quickstart-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={copy.placeholder}
              className="h-12 min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-4 text-base text-heading outline-none transition-shadow placeholder:text-muted focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:focus:border-brand-green dark:focus:ring-brand-green/20"
            />
            <button type="submit" className={buttonClasses("dark", "lg")}>
              {copy.submit}
            </button>
          </form>
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">
            {copy.note}
          </p>
        </div>
      </Container>
    </section>
  );
}
