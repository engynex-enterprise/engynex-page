"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, KeyRound, Mail, MessageCircle, Phone, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Select } from "@/components/ui/Select";
import { HealthBadge } from "@/components/accounts/HealthBadge";
import { accountDetailCopy } from "@/content/accountDetail";
import { accountsProCopy } from "@/content/accountsPro";
import type { Locale } from "@/i18n/config";
import { accountStages } from "@/lib/accounts";
import type { AccountStage } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/**
 * Cabecera de la cuenta: identidad, etapa y responsable editables, salud y
 * accesos rápidos (correo, llamada, WhatsApp, solicitud, CRM, acceso).
 */
export function AccountHeader({
  locale,
  account,
  stage: initialStage,
  ownerId: initialOwner,
  health,
  leadId,
  employees,
  canManageAccess,
}: {
  locale: Locale;
  account: { id: string; name: string; email: string; phone: string | null; company: string | null; kind: string; active: boolean };
  stage: AccountStage;
  ownerId: string | null;
  health: number | null;
  leadId: string | null;
  employees: { id: string; name: string }[];
  canManageAccess: boolean;
}) {
  const t = accountDetailCopy[locale];
  const p = accountsProCopy[locale];
  const router = useRouter();
  const [stage, setStage] = useState(initialStage);
  const [owner, setOwner] = useState(initialOwner ?? "");

  const save = async (patch: { stage?: AccountStage; owner_id?: string | null }) => {
    const { error } = await createClient().from("account_details").update(patch).eq("profile_id", account.id);
    if (!error) router.refresh();
  };
  const initials = account.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const phone = account.phone?.replace(/[^\d+]/g, "") ?? "";
  const wa = phone.replace(/^\+/, "");
  const btn = "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]";

  return (
    <div className="border-b border-line px-4 py-5 sm:px-6">
      <Link href={`/${locale}/portal/clientes`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-heading">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.back}
      </Link>
      <div className="mt-3 flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-deep-700 text-lg font-semibold text-white dark:bg-brand-green dark:text-deep-700" aria-hidden>
            {initials}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn("truncate text-xl font-semibold text-heading", !account.active && "opacity-60")}>{account.name}</h2>
              <span className="rounded-full bg-[var(--meta-active)] px-2.5 py-0.5 text-xs font-medium text-heading">{p.kinds[account.kind]}</span>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted">{[account.company, account.email].filter(Boolean).join(" · ")}</p>
            {health != null && (
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                {p.health.label}
                <HealthBadge value={health} labels={p.health} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-40">
            <Select
              size="sm"
              label={t.stage}
              value={stage}
              onChange={(v) => {
                setStage(v as AccountStage);
                void save({ stage: v as AccountStage });
              }}
              options={accountStages.map((s) => ({ value: s, label: p.stages[s] }))}
            />
          </div>
          <div className="w-44">
            <Select
              size="sm"
              label={p.owner}
              value={owner}
              onChange={(v) => {
                setOwner(v);
                void save({ owner_id: v || null });
              }}
              options={[{ value: "", label: p.noOwner }, ...employees.map((e) => ({ value: e.id, label: e.name }))]}
            />
          </div>
          <a href={`mailto:${account.email}`} className={btn}>
            <Mail className="h-4 w-4" aria-hidden />
            {t.actions.email}
          </a>
          {phone && (
            <a href={`tel:${phone}`} className={btn}>
              <Phone className="h-4 w-4" aria-hidden />
              {t.actions.call}
            </a>
          )}
          {wa.length >= 10 && (
            <a href={`https://wa.me/${wa.length === 10 ? `57${wa}` : wa}`} target="_blank" rel="noopener noreferrer" className={btn}>
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t.actions.whatsapp}
            </a>
          )}
          {leadId && (
            <Link href={`/${locale}/portal/crm/${leadId}`} className={btn}>
              <ExternalLink className="h-4 w-4" aria-hidden />
              {t.actions.lead}
            </Link>
          )}
          {canManageAccess && (
            <Link href={`/${locale}/portal/usuarios`} className={btn}>
              <KeyRound className="h-4 w-4" aria-hidden />
              {t.actions.access}
            </Link>
          )}
          <Link href={`/${locale}/portal/soporte/nueva?cliente=${account.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-brand-green px-3 text-sm font-semibold text-deep-700 hover:brightness-95">
            <Plus className="h-4 w-4" aria-hidden />
            {t.actions.ticket}
          </Link>
        </div>
      </div>
    </div>
  );
}
