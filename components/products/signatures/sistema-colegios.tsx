import { Bell, CalendarCheck, FileText, Megaphone, Wallet } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HeroActions, HeroBreadcrumb, toneClass } from "@/components/services/signatures/shared";
import { cn } from "@/lib/utils";
import { SchoolRoles } from "./parts/sistema-colegios-roles";
import type { ProductHeroProps, ProductSignature, ProductSignatureProps, Tone } from "./types";

/**
 * Sistema para Colegios: la metáfora es el boletín y el celular del
 * acudiente. Cabecera oscura e invertida (maqueta a la izquierda, texto a la
 * derecha): la planilla de notas con escala cualitativa y, encima, el
 * teléfono con las notificaciones para la familia. La sección insignia
 * cambia de rol: directivos, docentes, padres y estudiantes.
 */

const copy = {
  es: {
    sheet: "Boletín",
    term: "Periodo 2",
    student: "Estudiante · Grado 7°",
    subject: "Asignatura",
    level: "Desempeño",
    subjects: ["Matemáticas", "Lenguaje", "Ciencias naturales", "Ciencias sociales", "Inglés", "Artes"],
    scale: [
      { k: "S", label: "Superior" },
      { k: "A", label: "Alto" },
      { k: "B", label: "Básico" },
    ],
    attendance: "Asistencia del periodo",
    parents: "Portal de acudientes",
    notifs: [
      { t: "Boletín disponible", d: "Periodo 2" },
      { t: "Nueva circular", d: "Salida pedagógica" },
      { t: "Asistencia registrada", d: "Hoy, primera hora" },
      { t: "Recordatorio de pago", d: "Pensión del mes" },
    ],
    eyebrow: "Un portal para cada rol",
    title: "Cada quien ve lo que necesita",
    subtitle:
      "La misma información, organizada para quien la usa: la dirección, el aula y la casa.",
    tabsLabel: "Roles de la comunidad educativa",
    seesLabel: "Lo que ve",
    roles: [
      { name: "Directivos", lead: "Matrícula, cartera y la institución completa en tiempo real." },
      { name: "Docentes", lead: "Notas, asistencia y planeación desde el celular o el computador." },
      { name: "Padres", lead: "Notas, asistencia, comunicados y estado de cuenta sin llamar a la secretaría." },
      { name: "Estudiantes", lead: "Sus notas, su horario y sus boletines en un mismo lugar." },
    ],
  },
  en: {
    sheet: "Report card",
    term: "Term 2",
    student: "Student · Grade 7",
    subject: "Subject",
    level: "Performance",
    subjects: ["Mathematics", "Language arts", "Natural sciences", "Social studies", "English", "Arts"],
    scale: [
      { k: "S", label: "Superior" },
      { k: "H", label: "High" },
      { k: "B", label: "Basic" },
    ],
    attendance: "Term attendance",
    parents: "Guardian portal",
    notifs: [
      { t: "Report card available", d: "Term 2" },
      { t: "New circular", d: "Field trip" },
      { t: "Attendance recorded", d: "Today, first period" },
      { t: "Payment reminder", d: "Monthly tuition" },
    ],
    eyebrow: "A portal for every role",
    title: "Everyone sees what they need",
    subtitle:
      "The same information, organized for whoever uses it: the front office, the classroom and home.",
    tabsLabel: "School community roles",
    seesLabel: "What they see",
    roles: [
      { name: "Leadership", lead: "Enrollment, receivables and the whole school in real time." },
      { name: "Teachers", lead: "Grades, attendance and planning from phone or computer." },
      { name: "Parents", lead: "Grades, attendance, announcements and account status without calling the office." },
      { name: "Students", lead: "Their grades, schedule and report cards in one place." },
    ],
  },
};

/** Nivel ilustrativo por asignatura (índice en la escala) y ancho de su barra. */
const levels = [0, 1, 0, 2, 1, 0];
const widths = ["92%", "74%", "88%", "55%", "70%", "95%"];
const notifIcons = [FileText, Megaphone, CalendarCheck, Wallet];

function Hero({ product, locale, backLabel, backHref, categoryLabel, primary, secondary }: ProductHeroProps) {
  const c = product[locale];
  const t = copy[locale];

  return (
    <section className="overflow-hidden bg-deep-900 pb-20 pt-28 text-white sm:pb-28 sm:pt-32">
      <Container>
        <HeroBreadcrumb backLabel={backLabel} backHref={backHref} dark />
        <div className="mt-8 grid items-center gap-14 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* Texto (va segundo en pantallas anchas). */}
          <div className="lg:order-2">
            {categoryLabel && <p className="text-sm font-semibold text-brand-green">{categoryLabel}</p>}
            <h1 className="mt-3 text-balance text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
              {c.title}
            </h1>
            <p className="mt-5 text-xl font-medium text-white">{c.tagline}</p>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">{c.description}</p>
            <HeroActions primary={primary} secondary={secondary} dark className="mt-9" />
          </div>

          {/* Boletín + celular del acudiente (ilustrativo). */}
          <div aria-hidden className="relative lg:order-1 sm:pr-28 lg:pr-32">
            <div className="rounded-3xl bg-white p-5 text-deep-700 shadow-card-hover sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">{t.sheet}</p>
                  <p className="text-sm text-deep-500">{t.student}</p>
                </div>
                <span className="rounded-full bg-deep-700 px-3 py-1 text-xs font-semibold text-white">{t.term}</span>
              </div>
              <div className="mt-5 flex justify-between border-b border-deep-200 pb-2 text-[0.7rem] font-semibold text-deep-500">
                <span>{t.subject}</span>
                <span>{t.level}</span>
              </div>
              <ul className="divide-y divide-deep-100">
                {t.subjects.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 py-2.5">
                    <span className="w-28 shrink-0 truncate text-sm font-medium sm:w-36">{s}</span>
                    <span className="h-2 flex-1 rounded-full bg-deep-100">
                      <span
                        className={cn("block h-2 rounded-full", levels[i] === 0 ? "bg-brand-green" : "bg-deep-500")}
                        style={{ width: widths[i] }}
                      />
                    </span>
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                        levels[i] === 0 ? "bg-brand-green text-deep-700" : "bg-deep-100 text-deep-700",
                      )}
                    >
                      {t.scale[levels[i]].k}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.7rem] text-deep-500">
                {t.scale.map((s) => (
                  <span key={s.k} className="inline-flex items-center gap-1.5">
                    <span className="font-bold text-deep-700">{s.k}</span> {s.label}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-deep-100 p-3">
                <p className="text-[0.7rem] font-semibold text-deep-500">{t.attendance}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Array.from({ length: 20 }, (_, i) => (
                    <span key={i} className={cn("h-3 w-3 rounded-sm", i === 7 ? "bg-deep-400" : "bg-deep-700")} />
                  ))}
                </div>
              </div>
            </div>

            {/* Celular */}
            <div className="relative mx-auto -mt-10 w-60 rounded-[2.25rem] bg-deep-950 p-2 shadow-card-hover ring-1 ring-white/15 sm:absolute sm:-bottom-10 sm:right-0 sm:mt-0">
              <div className="rounded-[1.8rem] bg-deep-800 px-3 pb-4 pt-3">
                <div className="mx-auto h-1.5 w-14 rounded-full bg-white/20" />
                <div className="mt-4 flex items-center gap-2 px-1">
                  <Bell className="h-4 w-4 text-brand-green" />
                  <span className="text-xs font-semibold text-white">{t.parents}</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {t.notifs.map((n, i) => {
                    const Icon = notifIcons[i];
                    return (
                      <li key={n.t} className={cn("flex items-center gap-2.5 rounded-2xl p-2.5", i === 0 ? "bg-white/[0.12] ring-1 ring-brand-green/50" : "bg-white/[0.06]")}>
                        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full", i === 0 ? "bg-brand-green text-deep-700" : "bg-white/10 text-white")}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[0.7rem] font-semibold text-white">{n.t}</span>
                          <span className="block truncate text-[0.65rem] text-white/55">{n.d}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
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
  const m = c.modules;
  // Qué ve cada rol: módulos y características reales del producto.
  const sees = [
    [m[0], m[4], m[5]],
    [m[1], m[2], m[3]],
    [c.features[2], m[5], m[4]],
    [m[1], m[3], c.features[2]],
  ];
  const notes = [c.benefits[2]?.description, c.benefits[0]?.description, c.benefits[1]?.description, undefined];
  const roles = t.roles.map((r, i) => ({
    name: r.name,
    lead: r.lead,
    sees: sees[i].filter(Boolean),
    note: notes[i],
  }));

  return (
    <section className={cn("py-16 sm:py-24", toneClass(tone))}>
      <Container>
        <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} size="lg" />
        <div className="mt-10 sm:mt-14">
          <SchoolRoles roles={roles} tabsLabel={t.tabsLabel} seesLabel={t.seesLabel} cardTone={tone} />
        </div>
      </Container>
    </section>
  );
}

export const signature: ProductSignature = { Hero, Showcase };
