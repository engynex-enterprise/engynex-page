import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { isLocale } from "@/i18n/config";
import { requireProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { bogotaRange } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Portal",
  robots: { index: false, follow: false },
};

/**
 * Marco del portal. Exige sesión activa; si la contraseña es temporal, obliga
 * a cambiarla antes de entrar. Cada página verifica además su rol.
 */
export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, profile } = await requireProfile(locale);
  if (profile.must_change_password) {
    redirect(`/${locale}/acceso/nueva-clave?next=/${locale}/portal`);
  }
  await supabase.rpc("touch_last_seen");

  // Equipo y contadores del menú (solo para empleados).
  const employee = profile.kind === "employee";
  const [team, tickets, tasks] = employee
    ? await Promise.all([
        listEmployees(supabase),
        supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("done", false)
          .eq("assigned_to", profile.id)
          .lt("due_at", bogotaRange(1).to),
      ])
    : [[], { count: 0 }, { count: 0 }];

  return (
    <PortalShell
      locale={locale}
      profile={{
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        kind: profile.kind,
      }}
      team={team}
      counts={{ tickets: tickets.count ?? 0, tasks: tasks.count ?? 0 }}
    >
      {children}
    </PortalShell>
  );
}
