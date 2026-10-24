"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ticketsCopy } from "@/content/tickets";
import { Select } from "@/components/ui/Select";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { ticketPriorities } from "@/lib/tickets";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Solicitud desde el portal: nombre y correo salen de la cuenta. */
export function NewTicketForm({
  locale,
  categories,
}: {
  locale: Locale;
  categories: { value: string; label: string }[];
}) {
  const t = ticketsCopy[locale];
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subjectId = useId();
  const descriptionId = useId();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!category || !subject.trim() || !description.trim()) return setError(t.form.required);
    setError(null);
    setBusy(true);
    const { data, error: rpcError } = await createClient().rpc("submit_ticket", {
      p: { category, priority, subject, description },
    });
    if (rpcError || !data) {
      setBusy(false);
      return setError(rpcError?.message.includes("rate_limited") ? t.form.rate : t.form.error);
    }
    router.push(`/${locale}/portal/soporte/${(data as { id: string }).id}`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-5 rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8 dark:bg-card" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select size="md" label={t.form.category} value={category} onChange={setCategory} options={categories} placeholder="—" />
        <Select
          size="md"
          label={t.form.priority}
          value={priority}
          onChange={setPriority}
          options={ticketPriorities.map((p) => ({ value: p, label: t.priority[p] }))}
        />
      </div>
      <div>
        <label htmlFor={subjectId} className="mb-1.5 block text-sm font-semibold text-heading">
          {t.form.subject}
        </label>
        <input
          id={subjectId}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={200}
          placeholder={t.form.subjectPlaceholder}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={descriptionId} className="mb-1.5 block text-sm font-semibold text-heading">
          {t.form.description}
        </label>
        <textarea
          id={descriptionId}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={6}
          maxLength={5000}
          placeholder={t.form.descriptionPlaceholder}
          className={cn(inputClass, "h-auto resize-y py-3 leading-relaxed")}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div>
        <button type="submit" disabled={busy} className={buttonClasses("primary", "lg", "disabled:opacity-60")}>
          {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {t.form.submit}
        </button>
      </div>
    </form>
  );
}
