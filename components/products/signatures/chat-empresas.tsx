import { Bot, Search, UserRound } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "@/components/services/signatures/shared";
import { ChatFlow } from "./parts/chat-empresas-flow";
import type { ProductHeroProps, ProductSignature, ProductSignatureProps, Tone } from "./types";

/**
 * Chat para Empresas: la cabecera es una bandeja omnicanal (canales a la
 * izquierda, conversación bot → asesor al centro, ficha de contacto a la
 * derecha) bajo un titular centrado sobre marino. La sección insignia recorre
 * el camino "Del mensaje a la venta" con pestañas y los módulos reales.
 */
const CHANNELS = ["WhatsApp", "Web", "Instagram", "Facebook"];

const copy = {
  es: {
    inbox: "Bandeja",
    search: "Buscar conversación",
    customer: "Cliente A",
    question: "Hola, ¿me ayudan con un pedido?",
    bot: "Chatbot IA",
    botAnswer: "¡Hola! Claro que sí. ¿Me compartes el número de pedido?",
    handoff: "Conversación asignada a un asesor",
    agent: "Asesor",
    agentAnswer: "Hola, ya tengo tu caso. Te ayudo enseguida.",
    composer: "Escribe una respuesta…",
    quick: "Respuestas rápidas",
    contact: "Ficha de contacto",
    tags: ["Pedido", "Recurrente"],
    history: "Historial",
    showcaseEyebrow: "Cómo funciona",
    showcaseTitle: "Del mensaje a la venta",
    showcaseSubtitle:
      "Así recorre una conversación la plataforma: entra por cualquier canal, el chatbot resuelve lo repetitivo y un asesor cierra lo que necesita a una persona.",
    tabsLabel: "Etapas de una conversación",
    pointsLabel: "Lo que interviene en esta etapa",
    steps: [
      {
        label: "Llega el mensaje",
        text: "Cada canal cae en la misma bandeja compartida: nadie revisa cuatro aplicaciones distintas.",
      },
      {
        label: "Responde el bot",
        text: "El chatbot contesta lo frecuente con tu información y sabe cuándo pasar el caso a una persona.",
      },
      {
        label: "Asigna a un asesor",
        text: "La conversación llega al asesor disponible según el equipo, el turno y el horario de atención.",
      },
      {
        label: "Cierra y mide",
        text: "La conversación queda en la ficha del cliente y alimenta las métricas de atención del equipo.",
      },
    ],
    mock: {
      quickReplies: ["Horarios", "Cotizar", "Hablar con asesor"],
      agents: ["Asesor 1", "Asesor 2", "Asesor 3"],
      assigned: "Asignada por turno",
      metrics: ["Primera respuesta", "Resolución", "CSAT"],
      closed: "Conversación cerrada",
    },
  },
  en: {
    inbox: "Inbox",
    search: "Search conversations",
    customer: "Customer A",
    question: "Hi, can you help me with an order?",
    bot: "AI chatbot",
    botAnswer: "Hi! Of course. Could you share your order number?",
    handoff: "Conversation assigned to an agent",
    agent: "Agent",
    agentAnswer: "Hi, I have your case now. I'll help you right away.",
    composer: "Type a reply…",
    quick: "Quick replies",
    contact: "Contact record",
    tags: ["Order", "Returning"],
    history: "History",
    showcaseEyebrow: "How it works",
    showcaseTitle: "From message to sale",
    showcaseSubtitle:
      "This is how a conversation moves through the platform: it comes in on any channel, the chatbot handles the repetitive part and an agent closes what needs a person.",
    tabsLabel: "Stages of a conversation",
    pointsLabel: "What's involved at this stage",
    steps: [
      {
        label: "Message arrives",
        text: "Every channel lands in the same shared inbox: nobody checks four different apps.",
      },
      {
        label: "Bot replies",
        text: "The chatbot answers the frequent questions with your information and knows when to hand over to a person.",
      },
      {
        label: "Assign an agent",
        text: "The conversation reaches the available agent based on team, shift and business hours.",
      },
      {
        label: "Close and measure",
        text: "The conversation stays on the customer record and feeds the team's support metrics.",
      },
    ],
    mock: {
      quickReplies: ["Hours", "Get a quote", "Talk to an agent"],
      agents: ["Agent 1", "Agent 2", "Agent 3"],
      assigned: "Assigned by shift",
      metrics: ["First response", "Resolution", "CSAT"],
      closed: "Conversation closed",
    },
  },
};

/** Funciones (`features`) y módulos (`modules`) reales de cada etapa, por índice. */
const stepMap = [
  { features: [0], modules: [0] },
  { features: [1], modules: [1, 2] },
  { features: [2], modules: [5, 3] },
  { features: [3], modules: [4] },
];

function Hero({ product, locale, categoryLabel, ...props }: ProductHeroProps) {
  const c = product[locale];
  const t = copy[locale];

  return (
    <section className="relative overflow-hidden bg-deep-950 pb-16 pt-28 text-white sm:pb-24 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} dark />

        <div className="mx-auto mt-8 max-w-4xl text-center">
          {categoryLabel && (
            <p className="text-sm font-semibold text-brand-green">{categoryLabel}</p>
          )}
          <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
            {c.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-xl">
            {c.tagline}
          </p>
          <HeroActions
            primary={props.primary}
            secondary={props.secondary}
            dark
            className="mt-9 justify-center"
          />
        </div>

        {/* Bandeja omnicanal (ilustrativa). */}
        <div
          aria-hidden
          className="mx-auto mt-14 max-w-6xl overflow-hidden rounded-3xl bg-deep-900 ring-1 ring-white/10 sm:mt-16"
        >
          <div className="grid md:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)_16rem]">
            {/* Canales */}
            <div className="border-b border-white/10 p-4 md:border-b-0 md:border-r">
              <p className="hidden text-sm font-bold text-white md:block">{t.inbox}</p>
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs text-white/50 md:mt-3">
                <Search className="h-3.5 w-3.5" />
                {t.search}
              </div>
              <ul className="mt-3 flex gap-2 overflow-hidden md:flex-col">
                {CHANNELS.map((channel, i) => (
                  <li
                    key={channel}
                    className={cn(
                      "shrink-0 rounded-2xl md:p-3",
                      i === 0 ? "md:bg-white/10" : "",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-semibold",
                        i === 0 ? "bg-action text-deep-700" : "bg-white/10 text-white/80",
                      )}
                    >
                      {channel}
                    </span>
                    <span className="mt-2.5 hidden h-1.5 w-4/5 rounded-full bg-white/25 md:block" />
                    <span className="mt-1.5 hidden h-1.5 w-1/2 rounded-full bg-white/10 md:block" />
                  </li>
                ))}
              </ul>
            </div>

            {/* Conversación */}
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                    <UserRound className="h-4 w-4 text-white/80" />
                  </span>
                  <span className="text-sm font-bold text-white">{t.customer}</span>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.7rem] font-semibold text-white/80">
                  {CHANNELS[0]}
                </span>
              </div>

              <div className="flex-1 space-y-4 px-5 py-6 sm:px-8">
                <p className="max-w-[75%] rounded-2xl rounded-bl-md bg-white/10 px-4 py-2.5 text-sm text-white sm:max-w-[60%]">
                  {t.question}
                </p>
                <div className="ml-auto max-w-[80%] sm:max-w-[62%]">
                  <p className="mb-1 flex items-center justify-end gap-1 text-[0.7rem] font-semibold text-brand-green">
                    <Bot className="h-3 w-3" />
                    {t.bot}
                  </p>
                  <p className="rounded-2xl rounded-br-md bg-deep-700 px-4 py-2.5 text-sm text-white ring-1 ring-brand-green/40">
                    {t.botAnswer}
                  </p>
                </div>
                <div className="flex max-w-[60%] gap-1.5 rounded-2xl rounded-bl-md bg-white/10 px-4 py-3.5 sm:max-w-[40%]">
                  <span className="h-1.5 w-1/3 rounded-full bg-white/40" />
                  <span className="h-1.5 w-1/2 rounded-full bg-white/25" />
                </div>
                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-[0.7rem] font-semibold text-white/60">{t.handoff}</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <div className="ml-auto max-w-[80%] sm:max-w-[62%]">
                  <p className="mb-1 text-right text-[0.7rem] font-semibold text-white/70">
                    {t.agent}
                  </p>
                  <p className="rounded-2xl rounded-br-md bg-action px-4 py-2.5 text-sm font-medium text-deep-700">
                    {t.agentAnswer}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
                <span className="hidden shrink-0 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold text-brand-green ring-1 ring-brand-green/50 sm:inline-flex">
                  / {t.quick}
                </span>
                <span className="min-w-0 flex-1 truncate rounded-full bg-white/5 px-4 py-2 text-xs text-white/50">
                  {t.composer}
                </span>
                <span className="h-8 w-8 shrink-0 rounded-full bg-action" />
              </div>
            </div>

            {/* Ficha de contacto */}
            <div className="hidden border-l border-white/10 p-5 lg:block">
              <p className="text-xs font-semibold text-white/60">{t.contact}</p>
              <div className="mt-4 flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                  <UserRound className="h-6 w-6 text-white/80" />
                </span>
                <p className="mt-3 text-sm font-bold text-white">{t.customer}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/10 px-2.5 py-1 text-[0.7rem] font-semibold text-white/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-6 text-xs font-semibold text-white/60">{t.history}</p>
              <ul className="mt-3 space-y-3">
                {[0, 1, 2].map((k) => (
                  <li key={k} className="flex items-center gap-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-green/70" />
                    <span className="h-1.5 flex-1 rounded-full bg-white/15" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Showcase({ product, locale, tone }: ProductSignatureProps & { tone: Tone }) {
  const c = product[locale];
  const t = copy[locale];
  const steps = t.steps.map((s, i) => ({
    ...s,
    points: [
      ...stepMap[i].features.map((k) => c.features[k]),
      ...stepMap[i].modules.map((k) => c.modules[k]),
    ].filter(Boolean),
  }));

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <SectionHeading
          eyebrow={t.showcaseEyebrow}
          title={t.showcaseTitle}
          subtitle={t.showcaseSubtitle}
          size="lg"
        />
        <div className="mx-auto mt-12 max-w-6xl sm:mt-14">
          <ChatFlow
            steps={steps}
            label={t.tabsLabel}
            pointsLabel={t.pointsLabel}
            tone={tone}
            mock={{
              channels: CHANNELS,
              inbox: t.inbox,
              question: t.question,
              answer: t.botAnswer,
              quick: t.mock.quickReplies,
              bot: t.bot,
              agents: t.mock.agents,
              assigned: t.mock.assigned,
              metrics: t.mock.metrics,
              closed: t.mock.closed,
            }}
          />
        </div>
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
