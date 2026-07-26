import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { localizedHref } from "@/lib/site";
import type { Locale } from "@/i18n/config";

export function CtaBand({
  locale,
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: {
  locale: Locale;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="bg-white py-20 sm:py-24 dark:bg-navy-950">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-navy-950 px-6 py-16 text-center sm:px-16">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="bg-grid absolute inset-0 opacity-30" />
            <div className="absolute -left-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-green/25 blur-[110px]" />
            <div className="absolute -right-10 top-0 h-72 w-72 rounded-full bg-brand-blue/30 blur-[110px]" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {title}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-300">
              {subtitle}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                href={primaryHref ?? localizedHref(locale, "contacto")}
                variant="primary"
                size="lg"
              >
                {primaryLabel}
                <ArrowRight className="h-5 w-5" />
              </Button>
              {secondaryLabel && (
                <Button
                  href={secondaryHref ?? localizedHref(locale, "portafolio")}
                  variant="ghost"
                  size="lg"
                >
                  {secondaryLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
