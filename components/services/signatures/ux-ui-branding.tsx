import {
  Frame,
  Hand,
  MousePointer2,
  PenTool,
  Square,
  Type,
  ChevronDown,
  Search,
  Check,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type {
  ServiceSignature,
  SignatureHeroProps,
  SignatureProps,
  Tone,
} from "./types";

/**
 * UX/UI & Branding — la cabecera es un lienzo de herramienta de diseño:
 * capas a la izquierda, mesa de trabajo al centro (con el titular
 * "seleccionado") e inspector con la paleta y la tipografía de la marca.
 * La sección insignia es el tablero del sistema de diseño.
 */

const copy = {
  es: {
    file: "Marca · Mesa de trabajo 01",
    layers: "Capas",
    hero: "Portada",
    heroChildren: ["Titular", "Introducción", "Acciones"],
    inspector: "Inspector",
    color: "Color",
    type: "Tipografía",
    weights: ["Regular", "Semibold", "Bold"],
    showcase: {
      eyebrow: "Sistema de diseño",
      title: "Un sistema que tu equipo puede usar solo",
      subtitle:
        "Así se ve lo que entregamos: fundamentos de marca convertidos en tokens y componentes reutilizables, documentados y listos para diseño y desarrollo.",
      pages: "Páginas del archivo",
      foundations: "Fundamentos",
      colors: "Color",
      scale: "Escala tipográfica",
      spacing: "Espaciado",
      components: "Componentes",
      buttons: "Botones",
      input: "Campo de texto",
      inputLabel: "Correo de trabajo",
      inputPlaceholder: "nombre@empresa.com",
      card: "Tarjeta",
      chips: "Etiquetas",
      primary: "Primario",
      secondary: "Secundario",
      tertiary: "Contorno",
      dark: "Oscuro",
      scaleNames: ["Leyenda", "Cuerpo", "Subtítulo", "Título", "Display"],
      cardEyebrow: "Entregable",
      mapsTo: "Corresponde a",
    },
  },
  en: {
    file: "Brand · Artboard 01",
    layers: "Layers",
    hero: "Cover",
    heroChildren: ["Headline", "Intro", "Actions"],
    inspector: "Inspector",
    color: "Color",
    type: "Typography",
    weights: ["Regular", "Semibold", "Bold"],
    showcase: {
      eyebrow: "Design system",
      title: "A system your team can run on its own",
      subtitle:
        "This is what we hand off: brand foundations turned into tokens and reusable components, documented and ready for design and development.",
      pages: "File pages",
      foundations: "Foundations",
      colors: "Color",
      scale: "Type scale",
      spacing: "Spacing",
      components: "Components",
      buttons: "Buttons",
      input: "Text field",
      inputLabel: "Work email",
      inputPlaceholder: "name@company.com",
      card: "Card",
      chips: "Tags",
      primary: "Primary",
      secondary: "Secondary",
      tertiary: "Outline",
      dark: "Dark",
      scaleNames: ["Caption", "Body", "Subtitle", "Title", "Display"],
      cardEyebrow: "Deliverable",
      mapsTo: "Maps to",
    },
  },
};

const swatches = [
  { name: "Green", hex: "#9FDB4F", className: "bg-brand-green" },
  { name: "Navy", hex: "#1F2A46", className: "bg-deep-700" },
  { name: "Mist", hex: "#F1F4F7", className: "bg-deep-100" },
];

/** Asas de selección en las cuatro esquinas de un elemento. */
function SelectionBox({ label }: { label: string }) {
  const handle =
    "absolute h-2.5 w-2.5 rounded-[2px] border-2 border-deep-700 bg-white dark:border-brand-green";
  return (
    <span aria-hidden className="pointer-events-none absolute -inset-2 sm:-inset-3">
      <span className="absolute inset-0 border-2 border-deep-700 dark:border-brand-green" />
      <span className={cn(handle, "-left-1.5 -top-1.5")} />
      <span className={cn(handle, "-right-1.5 -top-1.5")} />
      <span className={cn(handle, "-bottom-1.5 -left-1.5")} />
      <span className={cn(handle, "-bottom-1.5 -right-1.5")} />
      <span className="absolute -top-7 left-0 rounded-md bg-deep-700 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-brand-green dark:text-deep-700">
        {label}
      </span>
    </span>
  );
}

function Hero(props: SignatureHeroProps) {
  const { service, locale } = props;
  const c = service[locale];
  const t = copy[locale];
  const dotGrid = {
    backgroundImage:
      "radial-gradient(circle, var(--line-strong) 1px, transparent 1.2px)",
    backgroundSize: "18px 18px",
  };

  return (
    <section className="bg-surface-soft pb-16 pt-28 text-body sm:pb-20 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} />

        <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-card shadow-card">
          {/* Barra de herramientas */}
          <div
            aria-hidden
            className="flex items-center gap-4 border-b border-line px-4 py-3 sm:px-5"
          >
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-deep-200" />
              <span className="h-3 w-3 rounded-full bg-deep-200" />
              <span className="h-3 w-3 rounded-full bg-deep-200" />
            </div>
            <div className="hidden items-center gap-1 sm:flex">
              {[MousePointer2, Frame, Square, PenTool, Type, Hand].map(
                (Icon, i) => (
                  <span
                    key={i}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg text-muted",
                      i === 0 && "bg-deep-700 text-white dark:bg-brand-green dark:text-deep-700",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                ),
              )}
            </div>
            <p className="min-w-0 flex-1 truncate text-center text-xs font-medium text-muted sm:text-sm">
              {t.file}
            </p>
            <span className="text-xs font-semibold text-muted">100%</span>
          </div>

          <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)_16rem]">
            {/* Capas: los entregables reales del servicio */}
            <aside
              aria-hidden
              className="hidden border-r border-line p-4 lg:block"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t.layers}
              </p>
              <ul className="mt-4 space-y-1 text-sm">
                <li>
                  <span className="flex items-center gap-2 rounded-lg bg-accent-soft px-2 py-1.5 font-semibold text-heading">
                    <ChevronDown className="h-3.5 w-3.5" />
                    <Frame className="h-3.5 w-3.5" />
                    {t.hero}
                  </span>
                  <ul className="ml-7 mt-1 space-y-1 border-l border-line pl-3">
                    {t.heroChildren.map((child, i) => (
                      <li
                        key={child}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1 text-muted",
                          i === 0 && "font-semibold text-heading ring-1 ring-deep-700 dark:ring-brand-green",
                        )}
                      >
                        <Type className="h-3 w-3" />
                        {child}
                      </li>
                    ))}
                  </ul>
                </li>
                {c.deliverables.map((d) => (
                  <li
                    key={d}
                    className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-body"
                  >
                    <Frame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                    <span className="leading-snug">{d}</span>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Lienzo con retícula de puntos y la mesa de trabajo */}
            <div className="min-w-0 p-4 sm:p-8 lg:p-10" style={dotGrid}>
              <p
                aria-hidden
                className="mb-2 text-xs font-medium text-muted"
              >
                {t.hero} — 1440
              </p>
              <div className="rounded-2xl bg-surface p-6 shadow-card sm:p-10 lg:p-12">
                <p className="text-sm font-semibold text-accent">{c.tagline}</p>
                <h1 className="relative mt-10 inline-block text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
                  {c.title}
                  <SelectionBox label={`H1 · Figtree Bold`} />
                </h1>
                <p className="mt-8 max-w-2xl text-lg leading-relaxed text-body">
                  {c.intro}
                </p>
                <HeroActions
                  primary={props.primary}
                  secondary={props.secondary}
                  className="mt-8"
                />
              </div>

              {/* Paleta compacta en pantallas sin inspector */}
              <div aria-hidden className="mt-4 flex flex-wrap gap-2 lg:hidden">
                {swatches.map((s) => (
                  <span
                    key={s.hex}
                    className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 text-xs font-semibold text-heading"
                  >
                    <span className={cn("h-5 w-5 rounded-full ring-1 ring-line", s.className)} />
                    {s.hex}
                  </span>
                ))}
                <span className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold text-heading">
                  Aa · Figtree
                </span>
              </div>
            </div>

            {/* Inspector: paleta y tipografía de la marca */}
            <aside
              aria-hidden
              className="hidden border-l border-line p-5 lg:block"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t.inspector}
              </p>
              <p className="mt-5 text-sm font-semibold text-heading">{t.color}</p>
              <ul className="mt-3 space-y-2">
                {swatches.map((s) => (
                  <li key={s.hex} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-9 w-9 rounded-xl ring-1 ring-line",
                        s.className,
                      )}
                    />
                    <span className="text-sm">
                      <span className="block font-semibold text-heading">
                        {s.hex}
                      </span>
                      <span className="text-xs text-muted">{s.name}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm font-semibold text-heading">{t.type}</p>
                <p className="mt-3 text-6xl font-bold leading-none tracking-tight text-heading">
                  Aa
                </p>
                <p className="mt-2 text-sm font-semibold text-heading">Figtree</p>
                <ul className="mt-3 space-y-1 text-sm text-body">
                  {t.weights.map((w, i) => (
                    <li
                      key={w}
                      className={cn(
                        i === 0 && "font-normal",
                        i === 1 && "font-semibold",
                        i === 2 && "font-bold text-heading",
                      )}
                    >
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sección insignia: tablero del sistema de diseño                            */
/* -------------------------------------------------------------------------- */

const palette = [
  { hex: "#9FDB4F", className: "bg-brand-green" },
  { hex: "#467316", className: "bg-brand-green-dark" },
  { hex: "#1F2A46", className: "bg-deep-700" },
  { hex: "#4A5674", className: "bg-deep-500" },
  { hex: "#C9CFDB", className: "bg-deep-200" },
  { hex: "#F1F4F7", className: "bg-deep-100" },
];

const typeScale = [
  { size: 14, className: "text-sm" },
  { size: 16, className: "text-base" },
  { size: 24, className: "text-2xl" },
  { size: 40, className: "text-[2.5rem]" },
  { size: 64, className: "text-[4rem]" },
];

const spacing = [4, 8, 16, 24, 32, 48];

function BoardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
      {children}
    </p>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const c = service[locale];
  const t = copy[locale].showcase;
  const panel = tone === "muted" ? "bg-card" : "bg-surface-soft";
  const inner = tone === "muted" ? "bg-surface-soft" : "bg-card";
  const [research, identity, prototype, system] = c.deliverables;

  return (
    <section className={cn("py-16 text-body sm:py-24", toneClass(tone))}>
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {t.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            {t.subtitle}
          </p>
        </div>

        {/* Páginas del archivo = entregables reales */}
        <div className="mt-10 sm:mt-14">
          <BoardLabel>{t.pages}</BoardLabel>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {c.deliverables.map((d, i) => (
              <li
                key={d}
                className={cn(
                  "flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-heading",
                  panel,
                )}
              >
                <span className="text-muted tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {d}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          {/* Fundamentos */}
          <div className={cn("rounded-3xl p-6 sm:p-8 lg:col-span-5", panel)}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-bold text-heading">{t.foundations}</h3>
              <span className="text-xs text-muted">
                {t.mapsTo}: {identity}
              </span>
            </div>

            <div className="mt-6">
              <BoardLabel>{t.colors}</BoardLabel>
              <ul className="mt-3 grid grid-cols-3 gap-3">
                {palette.map((p) => (
                  <li key={p.hex}>
                    <span
                      aria-hidden
                      className={cn(
                        "block h-14 rounded-2xl ring-1 ring-line",
                        p.className,
                      )}
                    />
                    <span className="mt-1.5 block text-xs font-semibold text-heading">
                      {p.hex}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <BoardLabel>{t.scale}</BoardLabel>
              <ul className="mt-3 divide-y divide-line">
                {typeScale.map((s, i) => (
                  <li
                    key={s.size}
                    className="flex items-baseline justify-between gap-4 py-2"
                  >
                    <span
                      className={cn(
                        "truncate font-bold leading-tight tracking-tight text-heading",
                        s.className,
                      )}
                    >
                      Aa
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {t.scaleNames[i]} · {s.size}px
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <BoardLabel>{t.spacing}</BoardLabel>
              <ul className="mt-3 flex items-end gap-3">
                {spacing.map((s) => (
                  <li key={s} className="flex flex-col items-center gap-1.5">
                    <span
                      aria-hidden
                      className="block rounded-[4px] bg-deep-700 dark:bg-brand-green"
                      style={{ width: s / 1.5 + 4, height: s }}
                    />
                    <span className="text-[11px] text-muted tabular-nums">
                      {s}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Componentes vivos, con las clases reales del sitio */}
          <div className={cn("rounded-3xl p-6 sm:p-8 lg:col-span-7", panel)}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-bold text-heading">{t.components}</h3>
              <span className="text-xs text-muted">
                {t.mapsTo}: {system}
              </span>
            </div>

            <div className="mt-6">
              <BoardLabel>{t.buttons}</BoardLabel>
              <div
                aria-hidden
                className={cn("mt-3 flex flex-wrap gap-3 rounded-2xl p-4", inner)}
              >
                <span className={buttonClasses("primary", "md")}>{t.primary}</span>
                <span className={buttonClasses("dark", "md")}>{t.dark}</span>
                <span className={buttonClasses("secondary", "md")}>
                  {t.secondary}
                </span>
                <span className={buttonClasses("outline", "md")}>{t.tertiary}</span>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <BoardLabel>{t.input}</BoardLabel>
                <div aria-hidden className="mt-3">
                  <span className="text-sm font-semibold text-heading">
                    {t.inputLabel}
                  </span>
                  <span
                    className={cn(
                      "mt-2 flex h-12 items-center gap-2 rounded-full px-5 text-sm text-muted ring-1 ring-line-strong",
                      inner,
                    )}
                  >
                    <Search className="h-4 w-4" />
                    {t.inputPlaceholder}
                  </span>
                </div>

                <div className="mt-8">
                  <BoardLabel>{t.chips}</BoardLabel>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {c.features.map((f) => (
                      <li
                        key={f}
                        className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-heading"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <BoardLabel>{t.card}</BoardLabel>
                <div aria-hidden className={cn("mt-3 rounded-3xl p-6", inner)}>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-action text-deep-700">
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  </span>
                  <p className="mt-5 text-xs font-semibold text-accent">
                    {t.cardEyebrow}
                  </p>
                  <p className="mt-1 text-lg font-bold leading-snug text-heading">
                    {prototype}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {research}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
