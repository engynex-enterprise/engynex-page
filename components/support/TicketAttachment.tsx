"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TicketAttachment } from "@/lib/supabase/types";
import { formatBytes } from "@/lib/tickets";
import { cn } from "@/lib/utils";

export const TICKET_FILES_BUCKET = "ticket-files";
export const MAX_TICKET_FILE_BYTES = 15 * 1024 * 1024;
/** Los mismos tipos que admite el bucket. */
export const TICKET_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "video/mp4",
  "video/quicktime",
];

/** Sube un archivo a t/<solicitud>/ y devuelve su descripción para ticket_reply. */
export async function uploadTicketFile(
  supabase: SupabaseClient<Database>,
  ticketId: string,
  file: File,
): Promise<{ attachment: TicketAttachment } | { error: "too_big" | "type" | "upload" }> {
  if (file.size > MAX_TICKET_FILE_BYTES) return { error: "too_big" };
  if (!TICKET_FILE_TYPES.includes(file.type)) return { error: "type" };
  const safe = file.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .slice(-80);
  const path = `t/${ticketId}/${crypto.randomUUID()}-${safe || "archivo"}`;
  const { error } = await supabase.storage.from(TICKET_FILES_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: "upload" };
  return { attachment: { path, name: file.name.slice(0, 160), mime: file.type, size: file.size } };
}

/** Adjunto de un mensaje: miniatura si es imagen o ficha con nombre y peso (enlace firmado de 1 hora). */
export function TicketAttachmentView({
  supabase,
  attachment,
  locale,
  tone = "light",
}: {
  supabase: SupabaseClient<Database>;
  attachment: TicketAttachment;
  locale: string;
  tone?: "light" | "dark";
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const image = attachment.mime?.startsWith("image/");

  useEffect(() => {
    let alive = true;
    void supabase.storage
      .from(TICKET_FILES_BUCKET)
      .createSignedUrl(attachment.path, 3600)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data) setFailed(true);
        else setUrl(data.signedUrl);
      });
    return () => {
      alive = false;
    };
  }, [supabase, attachment.path]);

  if (image && url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block overflow-hidden rounded-lg ring-1 ring-line">
        {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal de Storage */}
        <img src={url} alt={attachment.name} className="max-h-60 w-auto max-w-full object-contain" loading="lazy" />
      </a>
    );
  }
  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.name}
      aria-disabled={!url}
      className={cn(
        "flex max-w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left",
        tone === "dark" ? "bg-white/15 hover:bg-white/25" : "bg-surface ring-1 ring-line hover:bg-[var(--meta-hover)] dark:bg-white/[0.06]",
        !url && "pointer-events-none",
      )}
    >
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-md", tone === "dark" ? "bg-white/20" : "bg-card-soft text-heading dark:bg-white/10")}>
        {!url && !failed ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{attachment.name}</span>
        <span className={cn("block text-xs", tone === "dark" ? "opacity-80" : "text-muted")}>{failed ? "—" : formatBytes(attachment.size, locale)}</span>
      </span>
    </a>
  );
}
