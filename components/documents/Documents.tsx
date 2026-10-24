"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DocumentKind, PortalDocument } from "@/lib/supabase/types";
import { ticketsCopy } from "@/content/tickets";
import { Select } from "@/components/ui/Select";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import { formatBytes } from "@/lib/tickets";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const BUCKET = "portal-docs";
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Documentos privados de una cuenta. Los archivos viven en Storage bajo
 * `<id del dueño>/…`; las reglas de Storage y de la tabla dejan verlos solo
 * al dueño y al equipo. Se descargan con enlaces firmados de un minuto.
 */
export function Documents({
  locale,
  ownerId,
  docs,
  kinds,
  meId,
  staff,
  names,
}: {
  locale: Locale;
  ownerId: string;
  docs: PortalDocument[];
  /** Tipos que puede elegir quien sube. */
  kinds: DocumentKind[];
  meId: string;
  staff: boolean;
  names: Record<string, string>;
}) {
  const t = ticketsCopy[locale].docs;
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<DocumentKind>(kinds[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const fileId = useId();

  const upload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !title.trim()) return setError(t.errors.required);
    if (file.size > MAX_BYTES) return setError(t.errors.size);
    setError(null);
    setBusy("upload");
    const safe = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-80);
    const path = `${ownerId}/${crypto.randomUUID()}-${safe}`;
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (storageError) {
      setBusy(null);
      return setError(t.errors.generic);
    }
    const { error: rowError } = await supabase.from("documents").insert({
      owner_id: ownerId,
      title: title.trim(),
      kind,
      path,
      size: file.size,
      mime: file.type || null,
      uploaded_by: meId,
    });
    if (rowError) {
      await supabase.storage.from(BUCKET).remove([path]);
      setBusy(null);
      return setError(t.errors.generic);
    }
    setTitle("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setBusy(null);
    router.refresh();
  };

  const download = async (doc: PortalDocument) => {
    setBusy(doc.id);
    const name = doc.path.split("/").pop()?.replace(/^[0-9a-f-]{36}-/, "") ?? doc.title;
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(doc.path, 60, { download: name });
    setBusy(null);
    if (data?.signedUrl) window.location.assign(data.signedUrl);
  };

  const remove = async (doc: PortalDocument) => {
    if (!window.confirm(t.confirmDelete)) return;
    setBusy(doc.id);
    const { error: rowError } = await supabase.from("documents").delete().eq("id", doc.id);
    if (!rowError) await supabase.storage.from(BUCKET).remove([doc.path]);
    setBusy(null);
    router.refresh();
  };

  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));

  return (
    <div className="grid gap-6">
      <form onSubmit={upload} className="rounded-3xl bg-surface p-6 ring-1 ring-line dark:bg-card" noValidate>
        <h2 className="text-base text-heading">{t.upload}</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <div>
            <label htmlFor={titleId} className="mb-1.5 block text-xs font-semibold text-muted">
              {t.uploadTitle}
            </label>
            <input id={titleId} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} className={cn(inputClass, "h-11 text-sm")} />
          </div>
          <Select
            size="md"
            label={t.kind}
            value={kind}
            onChange={(v) => setKind(v as DocumentKind)}
            options={kinds.map((k) => ({ value: k, label: t.kinds[k] }))}
          />
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor={fileId} className="mb-1.5 block text-xs font-semibold text-muted">
              {t.file}
            </label>
            <input
              id={fileId}
              ref={fileRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              onChange={(event) => {
                const picked = event.target.files?.[0] ?? null;
                setFile(picked);
                if (picked && !title) setTitle(picked.name.replace(/\.[^.]+$/, ""));
              }}
              className="block w-full text-sm text-body file:mr-3 file:h-10 file:rounded-full file:border-0 file:bg-surface-soft file:px-4 file:text-sm file:font-semibold file:text-heading hover:file:bg-card-soft dark:file:bg-white/[0.08]"
            />
          </div>
          <button type="submit" disabled={busy === "upload"} className={buttonClasses("primary", "md", "disabled:opacity-60")}>
            {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
            {busy === "upload" ? t.uploading : t.upload}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </form>

      {docs.length === 0 ? (
        <p className="rounded-3xl bg-surface p-8 text-center text-sm text-muted ring-1 ring-line dark:bg-card">{t.empty}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface ring-1 ring-line dark:bg-card">
          {docs.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-soft text-accent dark:bg-white/[0.06]">
                <FileText className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-heading">{doc.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {t.kinds[doc.kind]} · {formatBytes(doc.size, locale)} · {fmt(doc.created_at)}
                  {doc.uploaded_by && names[doc.uploaded_by] ? ` · ${t.by.replace("{name}", names[doc.uploaded_by])}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => download(doc)}
                  disabled={busy === doc.id}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-heading ring-1 ring-line-strong hover:bg-surface-soft dark:hover:bg-white/[0.06]"
                >
                  {busy === doc.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
                  {t.download}
                </button>
                {(staff || doc.uploaded_by === meId) && (
                  <button
                    type="button"
                    onClick={() => remove(doc)}
                    aria-label={`${t.delete}: ${doc.title}`}
                    className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
