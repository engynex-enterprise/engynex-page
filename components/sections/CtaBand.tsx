import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Check, Mail, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { buttonClasses } from "@/components/ui/Button";
import { localizedHref, siteConfig } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const COPY = {
  es: {
    badge: "Te respondemos en menos de 24 horas",
    whatsapp: "Escribir por WhatsApp",
    whatsappMessage: "Hola, quiero hablar de un proyecto con Engynex.",
    trust: ["Propuesta en menos de 24 h", "Sin costo ni compromiso", "Te atiende un especialista"],
    stepsTitle: "Así empezamos",
    steps: [
      { title: "Nos cuentas tu idea", body: "Por el formulario o WhatsApp, en dos minutos." },
      { title: "Hablamos 30 minutos", body: "Una llamada o videollamada con un especialista." },
      { title: "Recibes tu propuesta", body: "Alcance, tiempos y costo, sin compromiso." },
    ],
    channels: "O contáctanos directo",
    call: "Llamar",
    email: "Correo",
    book: "Agendar reunión",
  },
  en: {
    badge: "We reply in under 24 hours",
    whatsapp: "Message us on WhatsApp",
    whatsappMessage: "Hi, I'd like to talk about a project with Engynex.",
    trust: ["Proposal in under 24 h", "No cost, no commitment", "A specialist on your project"],
    stepsTitle: "How we get started",
    steps: [
      { title: "Tell us your idea", body: "Through the form or WhatsApp, in two minutes." },
      { title: "We talk for 30 minutes", body: "A call or video call with a specialist." },
      { title: "You get your proposal", body: "Scope, timeline and cost, no commitment." },
    ],
    channels: "Or reach us directly",
    call: "Call",
    email: "Email",
    book: "Book a meeting",
  },
} as const;

/**
 * Cierre de página: tarjeta fotográfica a todo el ancho al estilo de las
 * piezas destacadas de meta.com, con la afirmación, las acciones (cotizar y
 * WhatsApp), las garantías de respuesta y una tarjeta con los tres pasos para
 * empezar y los canales de contacto directo.
 */
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
  const t = COPY[locale];
  const wa = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(t.whatsappMessage)}`;
  const channel = "flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20";

  return (
    <section className="bg-surface py-8 sm:py-12">
      <Container>
        <Reveal className="relative isolate overflow-hidden rounded-3xl bg-deep-800 text-white">
          <Image src="/images/cta-bg.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/65 to-black/40 lg:bg-gradient-to-r lg:from-black/85 lg:via-black/60 lg:to-black/30" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 -z-10 h-[26rem] w-[26rem] rounded-full bg-brand-green/20 blur-3xl" />

          <div className="grid gap-10 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16 lg:px-16 lg:py-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-70 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
                </span>
                {t.badge}
              </span>
              <h2 className="mt-5 max-w-[16ch] text-balance text-[clamp(2.3rem,4.8vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em]">{title}</h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{subtitle}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={primaryHref ?? localizedHref(locale, "contacto")} className={buttonClasses("primary", "lg")}>
                  {primaryLabel}
                </Link>
                <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(buttonClasses("glass", "lg"), "gap-2")}>
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {t.whatsapp}
                </a>
                {secondaryLabel && (
                  <Link href={secondaryHref ?? localizedHref(locale, "portafolio")} className={cn(buttonClasses("glass", "lg"), "max-sm:w-full")}>
                    {secondaryLabel}
                  </Link>
                )}
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
                {t.trust.map((x) => (
                  <li key={x} className="flex items-center gap-2 text-sm font-medium text-white/90">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-green text-deep-700">
                      <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.75rem] bg-white/10 p-6 ring-1 ring-inset ring-white/15 backdrop-blur-md sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-green">{t.stepsTitle}</p>
              <ol className="relative mt-5 grid gap-5">
                <span aria-hidden className="absolute bottom-4 left-[1.05rem] top-4 w-0.5 bg-white/20" />
                {t.steps.map((s, i) => (
                  <li key={s.title} className="relative flex gap-4">
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums", i === 0 ? "bg-brand-green text-deep-700" : "bg-white text-deep-700")}>{i + 1}</span>
                    <span className="pt-1">
                      <span className="block font-semibold text-white">{s.title}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-white/75">{s.body}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <p className="mt-7 border-t border-white/15 pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">{t.channels}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={wa} target="_blank" rel="noopener noreferrer" className={channel}>
                  <MessageCircle className="h-4 w-4 text-brand-green" aria-hidden />
                  WhatsApp
                </a>
                <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} className={channel}>
                  <Phone className="h-4 w-4 text-brand-green" aria-hidden />
                  {t.call}
                </a>
                <a href={`mailto:${siteConfig.email}`} className={channel}>
                  <Mail className="h-4 w-4 text-brand-green" aria-hidden />
                  {t.email}
                </a>
                <Link href={localizedHref(locale, "agendar")} className={channel}>
                  <CalendarCheck className="h-4 w-4 text-brand-green" aria-hidden />
                  {t.book}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
