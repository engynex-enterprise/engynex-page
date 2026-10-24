"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatAttachment, Database } from "@/lib/supabase/types";
import { ATTACHMENT_ACCEPT, CHAT_FILES_BUCKET, MAX_ATTACHMENT_BYTES, attachmentPath, formatBytes } from "@/lib/chatConfig";
import { cn } from "@/lib/utils";

/** Sube un archivo a la carpeta de la conversación y devuelve su descripción. */
export async function uploadChatFile(
  supabase: SupabaseClient<Database>,
  topic: string,
  file: File,
): Promise<{ attachment: ChatAttachment } | { error: "too_big" | "type" | "upload" }> {
  if (file.size > MAX_ATTACHMENT_BYTES) return { error: "too_big" };
  if (!ATTACHMENT_ACCEPT.includes(file.type)) return { error: "type" };
  const path = attachmentPath(topic, file.name);
  const { error } = await supabase.storage.from(CHAT_FILES_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: "upload" };
  return { attachment: { path, name: file.name.slice(0, 160), mime: file.type, size: file.size } };
}

/**
 * Un adjunto dentro de un mensaje: vista previa si es imagen, o una ficha con
 * el nombre y el peso. El enlace es temporal (1 hora) porque el bucket es privado.
 */
export function AttachmentView({
  supabase,
  attachment,
  tone = "light",
}: {
  supabase: SupabaseClient<Database>;
  attachment: ChatAttachment;
  /** "dark" cuando va sobre una burbuja oscura. */
  tone?: "light" | "dark";
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const image = attachment.mime?.startsWith("image/");

  useEffect(() => {
    let alive = true;
    void supabase.storage
      .from(CHAT_FILES_BUCKET)
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
      <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg">
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
        <span className={cn("block text-xs", tone === "dark" ? "opacity-80" : "text-muted")}>
          {failed ? "—" : formatBytes(attachment.size)}
        </span>
      </span>
    </a>
  );
}
