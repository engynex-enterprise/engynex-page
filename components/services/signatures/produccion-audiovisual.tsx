import Image from "next/image";
import {
  Film,
  Music,
  Play,
  Shapes,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { serviceGallery } from "@/content/serviceExtras";
import { getServiceProcess } from "@/content/serviceProcess";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type {
  ServiceSignature,
  SignatureHeroProps,
  SignatureProps,
  Tone,
} from "./types";

/**
 * Producción audiovisual — cabecera de cine: fotograma 21:9 a sangre con
 * perforaciones de película, código de tiempo y grabación. La sección
 * insignia es una línea de tiempo de editor de video con las etapas reales.
 */

const SLUG = "produccion-audiovisual";

const copy = {
  es: {
    showcase: {
      eyebrow: "Del guion a la entrega",
      title: "Así se arma tu pieza, pista por pista",
      subtitle:
        "Cada etapa del proyecto deja algo en la línea de tiempo: el concepto y el guion, el material de rodaje, el sonido y los gráficos que llegan a la entrega final.",
      sequence: "Secuencia · Máster",
      tracks: ["Video", "Audio", "Gráficos"],
      audio: ["Sonido en set", "Musicalización"],
      graphics: ["Motion graphics y subtítulos"],
      bin: "Material de trabajo",
      shot: "Toma",
    },
  },
  en: {
    showcase: {
      eyebrow: "From script to delivery",
      title: "How your piece comes together, track by track",
      subtitle:
        "Every stage of the project leaves something on the timeline: the concept and script, the footage, the sound and the graphics that reach final delivery.",
      sequence: "Sequence · Master",
      tracks: ["Video", "Audio", "Graphics"],
      audio: ["On-set sound", "Music"],
      graphics: ["Motion graphics and subtitles"],
      bin: "Media bin",
      shot: "Shot",
    },
  },
};

/** Perforaciones de película a lo ancho. */
function Perforations({ id }: { id: string }) {
  return (
    <svg aria-hidden className="block h-4 w-full text-white/25">
      <defs>
        <pattern
          id={id}
          width="28"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <rect x="7" y="4" width="14" height="8" rx="2" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Esquinas de visor de cámara. */
function Viewfinder() {
  const corner = "absolute h-6 w-6 border-white/70 sm:h-8 sm:w-8";
  return (
    <span aria-hidden className="pointer-events-none absolute inset-4 sm:inset-8">
      <span className={cn(corner, "left-0 top-0 border-l-2 border-t-2")} />
      <span className={cn(corner, "right-0 top-0 border-r-2 border-t-2")} />
      <span className={cn(corner, "bottom-0 left-0 border-b-2 border-l-2")} />
      <span className={cn(corner, "bottom-0 right-0 border-b-2 border-r-2")} />
    </span>
  );
}

function Hero(props: SignatureHeroProps) {
  const { service, locale } = props;
  const c = service[locale];
  const image = serviceGallery[SLUG]?.[0] ?? service.image;

  return (
    <section className="bg-black pt-16 text-white">
      <Container className="pb-6 pt-12 sm:pt-16">
        <HeroBreadcrumb
          backLabel={props.backLabel}
          backHref={props.backHref}
          dark
        />
      </Container>

      <div className="bg-black">
        <Perforations id="pa-perf-top" />
        <div className="relative isolate aspect-[4/5] overflow-hidden sm:aspect-video lg:aspect-[21/9]">
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/30 to-black/40"
          />
          <Viewfinder />

          {/* HUD de cámara */}
          <div
            aria-hidden
            className="absolute inset-x-8 top-8 flex items-center justify-between text-xs font-semibold tracking-widest text-white/90 sm:inset-x-14 sm:top-14 sm:text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 motion-safe:animate-pulse" />
              REC
            </span>
            <span className="font-mono tabular-nums">00:00:00:00</span>
          </div>

          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 hidden h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/15 ring-1 ring-white/40 backdrop-blur-sm sm:grid lg:h-24 lg:w-24"
          >
            <Play className="ml-1 h-8 w-8 fill-white text-white" />
          </span>

          <div className="absolute inset-x-0 bottom-0">
            <Container className="pb-10 sm:pb-14 lg:pb-16">
              <div className="px-4 sm:px-6">
                <p className="text-sm font-medium text-white/85">{c.tagline}</p>
                <h1 className="mt-3 max-w-4xl text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
                  {c.title}
                </h1>
              </div>
            </Container>
          </div>
        </div>
        <Perforations id="pa-perf-bottom" />
      </div>

      <Container className="grid gap-8 pb-16 pt-10 sm:pb-20 lg:grid-cols-12 lg:items-center">
        <p className="max-w-2xl text-lg leading-relaxed text-white/85 lg:col-span-7">
          {c.intro}
        </p>
        <HeroActions
          primary={props.primary}
          secondary={props.secondary}
          dark
          className="lg:col-span-5 lg:justify-end"
        />
      </Container>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sección insignia: línea de tiempo de edición                               */
/* -------------------------------------------------------------------------- */

interface Clip {
  label: string;
  /** Etapa inicial y final (incluida), 0–4. */
  from: number;
  to: number;
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const c = service[locale];
  const t = copy[locale].showcase;
  const steps = getServiceProcess(SLUG)?.[locale].steps ?? [];
  const gallery = serviceGallery[SLUG] ?? [];
  const cols = Math.max(steps.length, 1);
  const [concept, shoot, edit, social] = c.deliverables;

  const tracks: { name: string; icon: typeof Film; clips: Clip[]; tone: string }[] = [
    {
      name: t.tracks[0],
      icon: Film,
      tone: "bg-deep-500 text-white",
      clips: [
        { label: shoot, from: 2, to: 2 },
        { label: edit, from: 3, to: 3 },
        { label: social, from: 4, to: 4 },
      ],
    },
    {
      name: t.tracks[1],
      icon: Music,
      tone: "bg-deep-600 text-white",
      clips: [
        { label: t.audio[0], from: 2, to: 2 },
        { label: t.audio[1], from: 3, to: 4 },
      ],
    },
    {
      name: t.tracks[2],
      icon: Shapes,
      tone: "bg-action text-deep-700",
      clips: [
        { label: concept, from: 0, to: 1 },
        { label: t.graphics[0], from: 3, to: 3 },
      ],
    },
  ];

  const pct = (n: number) => `${(n / cols) * 100}%`;

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

        {/* Lista accesible de etapas; el editor es ilustrativo */}
        <ol className="sr-only">
          {steps.map((s) => (
            <li key={s.title}>
              {s.title}: {s.meta}
            </li>
          ))}
        </ol>

        <div
          aria-hidden
          className="mt-10 overflow-hidden rounded-3xl bg-deep-900 text-white ring-1 ring-white/10 sm:mt-14"
        >
          {/* Transporte */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <span className="h-2 w-2 rounded-full bg-brand-green" />
              {t.sequence}
            </span>
            <span className="flex items-center gap-3 text-white/70">
              <SkipBack className="h-4 w-4" />
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
              </span>
              <SkipForward className="h-4 w-4" />
            </span>
            <span className="hidden font-mono text-sm tabular-nums text-brand-green sm:block">
              00:00:00:00
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px] p-5">
              <div className="grid grid-cols-[7rem_1fr] gap-x-3">
                {/* Regla con las etapas reales */}
                <span />
                <div className="relative">
                  <div
                    className="grid border-b border-white/15 pb-2"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
                  >
                    {steps.map((s, i) => (
                      <div key={s.title} className="pr-2">
                        <span className="font-mono text-[11px] text-white/45">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="truncate text-xs font-semibold text-white/85">
                          {s.title}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Marcas de la regla */}
                  <div
                    className="h-2"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0 1px, transparent 1px 12px)",
                    }}
                  />
                </div>

                {tracks.map((track) => (
                  <TrackRow key={track.name} track={track} pct={pct} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Material: galería real del servicio */}
        {gallery.length > 0 && (
          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t.bin}
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {gallery.map((src, i) => (
                <li key={src}>
                  <div className="relative aspect-video overflow-hidden rounded-2xl bg-deep-900">
                    <Image
                      src={src}
                      alt={`${c.title} — ${t.shot} ${i + 1}`}
                      fill
                      sizes="(min-width: 1024px) 22vw, 45vw"
                      className="object-cover"
                    />
                    <span
                      aria-hidden
                      className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[11px] text-white"
                    >
                      {t.shot} {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}

function TrackRow({
  track,
  pct,
}: {
  track: { name: string; icon: typeof Film; clips: Clip[]; tone: string };
  pct: (n: number) => string;
}) {
  const Icon = track.icon;
  return (
    <>
      <div className="mt-3 flex h-14 items-center gap-2 rounded-xl bg-white/5 px-3 text-sm font-semibold text-white/85">
        <Icon className="h-4 w-4 text-white/60" />
        {track.name}
      </div>
      <div className="relative mt-3 h-14 rounded-xl bg-white/[0.04]">
        {track.clips.map((clip) => (
          <span
            key={clip.label}
            className={cn(
              "absolute inset-y-1.5 flex items-center overflow-hidden rounded-lg px-3 text-xs font-semibold leading-tight",
              track.tone,
            )}
            style={{
              left: `calc(${pct(clip.from)} + 3px)`,
              width: `calc(${pct(clip.to - clip.from + 1)} - 6px)`,
            }}
          >
            <span className="line-clamp-2">{clip.label}</span>
          </span>
        ))}
        {/* Cabezal de reproducción */}
        <span className="absolute -bottom-3 -top-3 left-[60%] z-10 w-0.5 -translate-x-1/2 bg-brand-green" />
      </div>
    </>
  );
}

export const signature: ServiceSignature = {
  Hero,
  Showcase,
  // La galería de trabajo ya está en la sección insignia.
  replaces: ["extra"],
};
