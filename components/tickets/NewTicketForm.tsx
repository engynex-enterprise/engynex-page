"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Loader2, Paperclip, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ticketsCopy } from "@/content/tickets";
import { supportNewCopy } from "@/content/supportNew";
import { Select } from "@/components/ui/Select";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { formatBytes, ticketPriorities } from "@/lib/tickets";
import type { Locale } from "@/i18n/config";
import type { SupportSla } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const MAX_FILES = 5;
const MAX_BYTES = 15 * 1024 * 1024;

type Account = { id: string; name: string; email: string; company: string | null };
type Person = { id: string; name: string };

/**
 * Nueva solicitud. El cliente la pide para sí (nombre y correo salen de su
 * cuenta); el equipo la registra por un cliente (con o sin cuenta), elige el
 * canal, el responsable y las etiquetas. Ambos pueden adjuntar archivos.
 */
export function NewTicketForm({
  locale,
  categories,
  sla,
  staff = false,
  accounts = [],
  employees = [],
  meId,
  initialAccount,
}: {
  locale: Locale;
  categories: { value: string; label: string }[];
  sla?: SupportSla;
  staff?: boolean;
  accounts?: Account[];
  employees?: Person[];
  meId?: string;
  /** Cuenta preseleccionada (desde la ficha del cliente). */
  initialAccount?: string;
}) {
  const t = ticketsCopy[locale];
  const n = supportNewCopy[locale];
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [affected, setAffected] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  // Solo equipo
  const [account, setAccount] = useState(initialAccount ?? "");
  const [person, setPerson] = useState({ name: "", email: "", phone: "", company: "" });
  const [channel, setChannel] = useState("phone");
  const [assignee, setAssignee] = useState(meId ?? "");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState<false | "create" | "upload">(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const ids = { subject: useId(), description: useId(), affected: useId(), tags: useId(), name: useId(), email: useId(), phone: useId(), company: useId() };

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    const big = incoming.find((f) => f.size > MAX_BYTES);
    if (big) setError(n.tooBig.replace("{name}", big.name));
    const next = [...files, ...incoming.filter((f) => f.size <= MAX_BYTES)];
    if (next.length > MAX_FILES) setError(n.tooMany);
    setFiles(next.slice(0, MAX_FILES));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const needPerson = staff && !account && (!person.name.trim() || !person.email.trim());
    if (!category || !subject.trim() || !description.trim() || needPerson) return setError(t.form.required);
    setError(null);
    setBusy("create");
    const supabase = createClient();
    const base = { category, priority, subject, description, affected };
    const { data, error: rpcError } = staff
      ? await supabase.rpc("staff_create_ticket", {
          p: {
            ...base,
            ...(account ? { requester_id: account } : person),
            channel: n.channels[channel],
            assigned_to: assignee,
            tags: tags.split(",").map((x) => x.trim()).filter(Boolean),
          },
        })
      : await supabase.rpc("submit_ticket", { p: base });
    if (rpcError || !data) {
      setBusy(false);
      return setError(rpcError?.message.includes("rate_limited") ? t.form.rate : t.form.error);
    }
    const id = (data as { id: string }).id;

    // Adjuntos: se suben a la carpeta de la solicitud y quedan como mensajes.
    if (files.length) {
      setBusy("upload");
      for (const file of files) {
        const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
        const path = `t/${id}/${crypto.randomUUID()}-${safe}`;
        const up = await supabase.storage.from("ticket-files").upload(path, file, { contentType: file.type || undefined });
        const sent = up.error
          ? up
          : await supabase.rpc("ticket_reply", {
              p_ticket: id,
              p_body: "",
              p_internal: false,
              p_attachment: { path, name: file.name, mime: file.type || null, size: file.size },
            });
        if (sent.error) {
          window.alert(n.uploadFailed.replace("{name}", file.name));
        }
      }
    }
    router.push(`/${locale}/portal/soporte/${id}`);
    router.refresh();
  };

  const field = "mb-1.5 block text-sm font-medium text-heading";
  const card = "rounded-xl border border-line bg-surface p-5 sm:p-6 dark:bg-card";
  const hours = (h: number) => n.hours.replace("{n}", String(h));

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]" noValidate>
      <div className="grid content-start gap-5">
        {staff && (
          <section className={card}>
            <h2 className="mb-4 text-[0.98rem] font-semibold text-heading">{n.customer}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                size="md"
                label={n.account}
                value={account}
                onChange={setAccount}
                options={[{ value: "", label: n.accountNone }, ...accounts.map((a) => ({ value: a.id, label: a.company ? `${a.name} · ${a.company}` : a.name }))]}
              />
              <Select size="md" label={n.channel} value={channel} onChange={setChannel} options={Object.entries(n.channels).map(([value, label]) => ({ value, label }))} />
              {!account &&
                (["name", "email", "phone", "company"] as const).map((k) => (
                  <div key={k}>
                    <label htmlFor={ids[k]} className={field}>{n[k]}</label>
                    <input
                      id={ids[k]}
                      type={k === "email" ? "email" : k === "phone" ? "tel" : "text"}
                      value={person[k]}
                      onChange={(e) => setPerson((p) => ({ ...p, [k]: e.target.value }))}
                      className={cn(inputClass, "h-11 text-[0.95rem]")}
                    />
                  </div>
                ))}
              <Select size="md" label={n.assignee} value={assignee} onChange={setAssignee} options={employees.map((e) => ({ value: e.id, label: e.name }))} />
              <div>
                <label htmlFor={ids.tags} className={field}>{n.tags}</label>
                <input id={ids.tags} value={tags} onChange={(e) => setTags(e.target.value)} placeholder={n.tagsPlaceholder} className={cn(inputClass, "h-11 text-[0.95rem]")} />
              </div>
            </div>
          </section>
        )}

        <section className={cn(card, "grid gap-5")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select size="md" label={t.form.category} value={category} onChange={setCategory} options={categories} placeholder="—" />
            <div>
              <Select
                size="md"
                label={t.form.priority}
                value={priority}
                onChange={setPriority}
                options={ticketPriorities.map((p) => ({ value: p, label: t.priority[p] }))}
              />
              <p className="mt-1.5 text-xs text-muted">
                {n.priorityHelp[priority]}
                {sla?.[priority as keyof SupportSla] && ` ${n.slaNote.replace("{h}", hours(sla[priority as keyof SupportSla].first_h))}`}
              </p>
            </div>
          </div>
          <div>
            <label htmlFor={ids.subject} className={field}>{t.form.subject}</label>
            <input
              id={ids.subject}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={200}
              placeholder={t.form.subjectPlaceholder}
              className={cn(inputClass, "h-11 text-[0.95rem]")}
            />
          </div>
          <div>
            <label htmlFor={ids.description} className={field}>{t.form.description}</label>
            <textarea
              id={ids.description}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={7}
              maxLength={5000}
              placeholder={t.form.descriptionPlaceholder}
              className={cn(inputClass, "h-auto resize-y py-3 text-[0.95rem] leading-relaxed")}
            />
          </div>
          <div>
            <label htmlFor={ids.affected} className={field}>{n.affected}</label>
            <input
              id={ids.affected}
              value={affected}
              onChange={(event) => setAffected(event.target.value)}
              maxLength={120}
              placeholder={n.affectedPlaceholder}
              className={cn(inputClass, "h-11 text-[0.95rem]")}
            />
          </div>

          <div>
            <p className={field}>{n.files}</p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                addFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border border-dashed px-4 py-4 transition-colors",
                drag ? "border-brand-green-dark bg-[var(--meta-active)]" : "border-line-strong",
              )}
            >
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={files.length >= MAX_FILES}
                className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)] disabled:opacity-50"
              >
                <Paperclip className="h-4 w-4" aria-hidden />
                {n.addFiles}
              </button>
              <span className="text-sm text-muted">{n.drop}</span>
              <span className="w-full text-xs text-muted">{n.filesHint}</span>
              <input
                ref={fileInput}
                type="file"
                multiple
                hidden
                accept="image/*,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.zip,video/mp4,video/quicktime"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            {files.length > 0 && (
              <ul className="mt-3 grid gap-2">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg bg-[var(--meta-active)]/60 px-3 py-2 text-sm">
                    <Paperclip className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-heading">{f.name}</span>
                    <span className="shrink-0 tabular-nums text-xs text-muted">{formatBytes(f.size, locale)}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((list) => list.filter((_, j) => j !== i))}
                      aria-label={n.remove.replace("{name}", f.name)}
                      className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[var(--meta-hover)] hover:text-heading"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!!busy} className={buttonClasses("primary", "md", "disabled:opacity-60")}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t.form.submit}
            </button>
            {busy === "upload" && <span className="text-sm text-muted">{n.uploading}</span>}
          </div>
        </section>
      </div>

      <aside className="grid content-start gap-5">
        <section className={card}>
          <h2 className="mb-3 flex items-center gap-2 text-[0.98rem] font-semibold text-heading">
            <Lightbulb className="h-4 w-4 text-accent" aria-hidden />
            {n.tipsTitle}
          </h2>
          <ul className="grid gap-2.5 text-sm leading-relaxed text-body">
            {n.tips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green-dark dark:bg-brand-green" aria-hidden />
                {tip}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </form>
  );
}
