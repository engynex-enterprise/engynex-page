import {
  BarChart3,
  Bot,
  Check,
  Cpu,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { HeroActions, HeroBreadcrumb, toneClass } from "./shared";
import type {
  ServiceSignature,
  SignatureHeroProps,
  SignatureProps,
  Tone,
} from "./types";

/**
 * IA & Automatización — la cabecera es una conversación: el cliente pide
 * automatizar una tarea y el asistente confirma lo que dejó funcionando. La
 * sección insignia compara el proceso manual con el automatizado.
 */
const copy = {
  es: {
    you: "Tú",
    assistant: "Asistente Engynex",
    online: "En línea",
    request:
      "Cada mañana descargo los pedidos, los paso a una hoja de cálculo y le envío el reporte al equipo. ¿Lo podemos automatizar?",
    reply: "Listo. Dejé esto funcionando:",
    tasks: [
      "Flujo de automatización activo: pedidos → reporte",
      "Reporte diario enviado al equipo",
      "Consultas de clientes respondidas 24/7",
      "Integración y monitoreo encendidos",
    ],
    followUp: "¿Y si el cliente pregunta algo que no sabes?",
    placeholder: "Escribe un mensaje…",
    eyebrow: "Antes y después",
    title: "El mismo proceso, sin el trabajo repetitivo",
    subtitle:
      "Así cambia una solicitud típica de un cliente cuando la IA y la automatización se encargan de las tareas que se repiten.",
    beforeTitle: "Proceso manual",
    beforeCaption: "Alguien de tu equipo hace cada paso, uno por uno.",
    before: [
      "Recibir la solicitud por correo o WhatsApp",
      "Leerla y decidir a quién le corresponde",
      "Copiar los datos a la hoja de cálculo",
      "Consultar precios y disponibilidad",
      "Redactar y enviar la respuesta",
      "Actualizar el reporte al final del día",
    ],
    afterTitle: "Proceso automatizado",
    afterCaption: "El flujo corre solo y tu equipo atiende lo que importa.",
    after: [
      "El asistente recibe, entiende y clasifica la solicitud",
      "El flujo registra los datos y responde al instante",
      "El reporte se actualiza solo, sin copiar y pegar",
      "Solo los casos especiales pasan a una persona",
    ],
    capabilities: "Lo que ponemos a trabajar",
    featureNotes: [
      "Responden a tus clientes a cualquier hora y escalan a una persona cuando el caso lo amerita.",
      "Tareas repetitivas como entrada de datos, reportes y seguimiento de leads corren sin intervención.",
      "Conectamos modelos de lenguaje de forma segura con tus documentos, datos y sistemas.",
      "Tus datos convertidos en tableros e insights para decidir con información.",
    ],
  },
  en: {
    you: "You",
    assistant: "Engynex Assistant",
    online: "Online",
    request:
      "Every morning I download the orders, copy them into a spreadsheet and send the report to the team. Can we automate it?",
    reply: "Done. Here's what's running now:",
    tasks: [
      "Automation workflow active: orders → report",
      "Daily report sent to the team",
      "Customer questions answered 24/7",
      "Integration and monitoring switched on",
    ],
    followUp: "What if a customer asks something you don't know?",
    placeholder: "Type a message…",
    eyebrow: "Before and after",
    title: "The same process, without the repetitive work",
    subtitle:
      "This is how a typical customer request changes when AI and automation take over the tasks that keep repeating.",
    beforeTitle: "Manual process",
    beforeCaption: "Someone on your team does every step, one by one.",
    before: [
      "Receive the request by email or WhatsApp",
      "Read it and decide who should handle it",
      "Copy the data into the spreadsheet",
      "Check prices and availability",
      "Write and send the reply",
      "Update the report at the end of the day",
    ],
    afterTitle: "Automated process",
    afterCaption: "The workflow runs on its own and your team handles what matters.",
    after: [
      "The assistant receives, understands and classifies the request",
      "The workflow logs the data and replies instantly",
      "The report updates itself, no copy-paste",
      "Only special cases go to a person",
    ],
    capabilities: "What we put to work",
    featureNotes: [
      "They answer your customers any time and hand over to a person when the case calls for it.",
      "Repetitive tasks such as data entry, reports and lead follow-up run without intervention.",
      "We connect language models securely to your documents, data and systems.",
      "Your data turned into dashboards and insights to decide with information.",
    ],
  },
};

const featureIcons = [Bot, Workflow, Cpu, BarChart3];

function ChatMock({ locale }: { locale: SignatureProps["locale"] }) {
  const t = copy[locale];
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-line"
    >
      {/* Barra superior de la ventana */}
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-deep-700 text-brand-green">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-heading">
            {t.assistant}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-brand-green" />
            {t.online}
          </p>
        </div>
      </div>

      <div className="space-y-4 px-4 py-5 sm:px-5">
        {/* Mensaje del cliente */}
        <div className="flex flex-col items-end">
          <span className="mb-1 text-xs font-semibold text-muted">{t.you}</span>
          <p className="max-w-[85%] rounded-3xl rounded-br-md bg-deep-700 px-4 py-3 text-sm leading-relaxed text-white dark:bg-deep-600">
            {t.request}
          </p>
        </div>

        {/* Respuesta del asistente */}
        <div className="flex flex-col items-start">
          <span className="mb-1 text-xs font-semibold text-muted">
            {t.assistant}
          </span>
          <div className="max-w-[90%] rounded-3xl rounded-bl-md bg-surface-soft px-4 py-3 text-sm text-heading">
            <p className="font-semibold">{t.reply}</p>
            <ul className="mt-3 space-y-2">
              {t.tasks.map((task) => (
                <li key={task} className="flex items-start gap-2">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-action text-deep-700">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="leading-snug">{task}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Nueva pregunta + indicador de escritura */}
        <div className="flex justify-end">
          <p className="max-w-[85%] rounded-3xl rounded-br-md bg-deep-700 px-4 py-3 text-sm leading-relaxed text-white dark:bg-deep-600">
            {t.followUp}
          </p>
        </div>
        <div className="flex">
          <span className="inline-flex items-center gap-1.5 rounded-3xl rounded-bl-md bg-surface-soft px-4 py-3.5">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                style={{ animationDelay: `${delay}ms` }}
                className="h-2 w-2 rounded-full bg-muted motion-safe:animate-bounce"
              />
            ))}
          </span>
        </div>
      </div>

      {/* Campo de texto */}
      <div className="border-t border-line px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between rounded-full bg-surface-soft py-2 pl-4 pr-2 text-sm text-muted">
          {t.placeholder}
          <span className="grid h-8 w-8 place-items-center rounded-full bg-action text-deep-700">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

function Hero(props: SignatureHeroProps) {
  const { service, locale } = props;
  const c = service[locale];
  return (
    <section className="relative overflow-hidden bg-surface pb-16 pt-28 sm:pb-24 sm:pt-32">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <HeroBreadcrumb backLabel={props.backLabel} backHref={props.backHref} />
          <p className="mt-8 text-sm font-semibold text-accent">{c.tagline}</p>
          <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heading">
            {c.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-body">
            {c.intro}
          </p>
          <HeroActions
            primary={props.primary}
            secondary={props.secondary}
            className="mt-8"
          />
        </div>
        <ChatMock locale={locale} />
      </Container>
    </section>
  );
}

function Showcase({ service, locale, tone }: SignatureProps & { tone: Tone }) {
  const t = copy[locale];
  const c = service[locale];
  const card = tone === "muted" ? "bg-card" : "bg-surface-soft";

  return (
    <section className={cn("isolate py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-accent">{t.eyebrow}</p>
          <h2 className="mt-3 text-balance text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15] text-heading">
            {t.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {/* Antes */}
          <div className={cn("rounded-3xl p-6 sm:p-8", card)}>
            <h3 className="text-xl font-bold text-heading">{t.beforeTitle}</h3>
            <p className="mt-1 text-sm text-muted">{t.beforeCaption}</p>
            <ol className="mt-6 space-y-3">
              {t.before.map((step, i) => (
                <li key={step} className="flex items-center gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-line text-sm font-bold text-muted">
                    {i + 1}
                  </span>
                  <span className="text-base text-muted">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Después */}
          <div className="rounded-3xl bg-deep-700 p-6 text-white sm:p-8 dark:bg-card-soft">
            <h3 className="text-xl font-bold text-white">{t.afterTitle}</h3>
            <p className="mt-1 text-sm text-white/75">{t.afterCaption}</p>
            <ol className="mt-6 space-y-3">
              {t.after.map((step) => (
                <li key={step} className="flex items-center gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-action text-deep-700">
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-base font-semibold text-white">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <h3 className="mt-16 text-center text-2xl font-bold text-heading">
          {t.capabilities}
        </h3>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.features.map((feature, i) => {
            const Icon = featureIcons[i % featureIcons.length];
            return (
              <li key={feature} className={cn("rounded-3xl p-6", card)}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-5 text-lg font-bold leading-snug text-heading">
                  {feature}
                </p>
                {t.featureNotes[i] && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {t.featureNotes[i]}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

export const signature: ServiceSignature = { Hero, Showcase };
