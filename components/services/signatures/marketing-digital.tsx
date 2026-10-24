import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import {
  MarketingChannelBoard,
  type Channel,
} from "./parts/marketing-digital-board";
import type {
  ServiceSignature,
  SignatureHeroProps,
  SignatureProps,
  Tone,
} from "./types";

/**
 * Marketing digital — cabecera editorial con el embudo de campaña a la
 * derecha, alimentado por los canales reales del servicio. La sección
 * insignia es un tablero de canales con una semana tipo del calendario.
 */

const copy = {
  es: {
    funnelLabel: "Embudo de campaña",
    channelsLabel: "Canales",
    stages: ["Alcance", "Interés", "Conversión", "Fidelización"],
    showcase: {
      eyebrow: "Canal por canal",
      title: "Qué hacemos en cada canal",
      subtitle:
        "Elige un canal para ver el trabajo, los entregables y cómo se ve una semana del calendario de contenidos.",
      tablist: "Canales de marketing",
      what: "Qué hacemos",
      deliverables: "Entregables",
      week: "Una semana del calendario",
      weekNote: "Ejemplo ilustrativo; el plan real se arma con tu marca.",
      empty: "Sin publicaciones",
      days: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      channels: [
        {
          what: "Auditoría técnica, investigación de palabras clave y contenido que responde lo que tu cliente busca en Google. Es una inversión que madura en meses.",
          deliverables: [2, 0],
          posts: [
            { day: 0, label: "Artículo de blog" },
            { day: 2, label: "Ajustes on-page" },
            { day: 4, label: "Revisión en Search Console" },
          ],
        },
        {
          what: "Estructura de campañas en Google Ads y Meta Ads, audiencias y creatividades. Revisamos el costo por lead cada semana y ajustamos presupuesto.",
          deliverables: [1, 3],
          posts: [
            { day: 0, label: "Revisión de audiencias" },
            { day: 1, label: "Nuevas creatividades" },
            { day: 3, label: "Ajuste de presupuesto" },
            { day: 4, label: "Prueba A/B de anuncios" },
          ],
        },
        {
          what: "Calendario editorial, piezas gráficas, textos y video corto para tus redes, alineados con el mensaje de cada campaña.",
          deliverables: [0, 1],
          posts: [
            { day: 0, label: "Carrusel" },
            { day: 2, label: "Video corto" },
            { day: 3, label: "Historia" },
            { day: 4, label: "Publicación de producto" },
            { day: 5, label: "Reel" },
          ],
        },
        {
          what: "Medimos qué funciona en cada canal y lo contamos en un informe claro: qué funcionó, qué no y en qué invertimos el mes que viene.",
          deliverables: [3, 0],
          posts: [
            { day: 0, label: "Lectura del tablero" },
            { day: 2, label: "Revisión de conversiones" },
            { day: 4, label: "Resumen semanal" },
          ],
        },
      ],
    },
  },
  en: {
    funnelLabel: "Campaign funnel",
    channelsLabel: "Channels",
    stages: ["Reach", "Interest", "Conversion", "Loyalty"],
    showcase: {
      eyebrow: "Channel by channel",
      title: "What we do on each channel",
      subtitle:
        "Pick a channel to see the work, the deliverables and what a week of the content calendar looks like.",
      tablist: "Marketing channels",
      what: "What we do",
      deliverables: "Deliverables",
      week: "A week of the calendar",
      weekNote: "Illustrative example; the real plan is built with your brand.",
      empty: "No posts",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      channels: [
        {
          what: "Technical audit, keyword research and content that answers what your customers search for on Google. It's an investment that matures over months.",
          deliverables: [2, 0],
          posts: [
            { day: 0, label: "Blog article" },
            { day: 2, label: "On-page tweaks" },
            { day: 4, label: "Search Console review" },
          ],
        },
        {
          what: "Campaign structure on Google Ads and Meta Ads, audiences and creatives. We review cost per lead weekly and adjust the budget.",
          deliverables: [1, 3],
          posts: [
            { day: 0, label: "Audience review" },
            { day: 1, label: "New creatives" },
            { day: 3, label: "Budget adjustment" },
            { day: 4, label: "Ad A/B test" },
          ],
        },
        {
          what: "Editorial calendar, graphics, copy and short video for your social channels, aligned with each campaign's message.",
          deliverables: [0, 1],
          posts: [
            { day: 0, label: "Carousel" },
            { day: 2, label: "Short video" },
            { day: 3, label: "Story" },
            { day: 4, label: "Product post" },
            { day: 5, label: "Reel" },
          ],
        },
        {
          what: "We measure what works on each channel and report it clearly: what worked, what didn't and where next month's budget goes.",
          deliverables: [3, 0],
          posts: [
            { day: 0, label: "Dashboard reading" },
            { day: 2, label: "Conversion review" },
            { day: 4, label: "Weekly summary" },
          ],
        },
      ],
    },
  },
};

/** Barras del embudo: margen lateral (%) arriba y abajo de cada tramo. */
const insets = [0, 7, 14, 21, 28];
const stageTone = [
  "bg-deep-700 text-white dark:bg-deep-600",
  "bg-deep-600 text-white dark:bg-deep-500",
  "bg-deep-500 text-white dark:bg-deep-400 dark:text-deep-950",
  "bg-action text-deep-700",
];

function Funnel({ stages, label }: { stages: string[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col gap-1.5">
      {stages.map((stage, i) => {
        const top = insets[i];
        const bottom = insets[i + 1];
        return (
          <li
            key={stage}
            className={cn(
              "flex h-16 items-center justify-center text-base font-bold sm:h-[4.5rem] sm:text-lg",
              stageTone[i],
            )}
            style={{
              clipPath: `polygon(${top}% 0, ${100 - top}% 0, ${100 - bottom}% 100%, ${bottom}% 100%)`,
            }}
          >
            {stage}
          </li>
        );
      })}
    </ol>
  );
}

function Hero(props: SignatureHeroProps) {
  const { service, locale } = props;
  const c = service[locale];
  const t = copy[locale];

  return (
    <section className="bg-surface pb-16 pt-28 text-body sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} />

        <div className="mt-8 grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">
              {c.tagline}
            </p>
            <h1 className="mt-4 text-balance text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-[0.98] tracking-[-0.035em] text-heading">
              {c.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-body sm:text-xl">
              {c.intro}
            </p>
            <HeroActions
              primary={props.primary}
              secondary={props.secondary}
              className="mt-8"
            />
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl bg-surface-soft p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t.channelsLabel}
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {c.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-sm font-semibold leading-tight text-heading shadow-card"
                  >
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full bg-action"
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Los canales confluyen hacia la boca del embudo */}
              <svg
                aria-hidden
                viewBox="0 0 400 48"
                preserveAspectRatio="none"
                className="my-2 h-10 w-full text-line-strong sm:h-12"
              >
                {[50, 150, 250, 350].map((x) => (
                  <path
                    key={x}
                    d={`M${x} 0 C ${x} 30, 200 18, 200 48`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 5"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>

              <Funnel stages={t.stages} label={t.funnelLabel} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const c = service[locale];
  const t = copy[locale].showcase;
  const surface = tone === "muted" ? "bg-card" : "bg-surface-soft";
  const inner = tone === "muted" ? "bg-surface-soft" : "bg-card";

  const channels: Channel[] = c.features.map((name, i) => {
    const ch = t.channels[i];
    return {
      name,
      what: ch.what,
      deliverables: ch.deliverables.map((d) => c.deliverables[d]),
      posts: ch.posts,
    };
  });

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
        <div className="mt-10 sm:mt-14">
          <MarketingChannelBoard
            channels={channels}
            days={t.days}
            labels={{
              tablist: t.tablist,
              what: t.what,
              deliverables: t.deliverables,
              week: t.week,
              weekNote: t.weekNote,
              empty: t.empty,
            }}
            surface={surface}
            inner={inner}
          />
        </div>
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
