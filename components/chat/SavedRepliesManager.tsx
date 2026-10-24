"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChatSavedReply } from "@/lib/supabase/types";
import { liveChatCopy } from "@/content/liveChat";
import { buttonClasses } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/inputClass";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Row = Pick<ChatSavedReply, "title" | "shortcut" | "body"> & { id?: string };

/** Respuestas guardadas del chat: el equipo las crea, edita y borra. */
export function SavedRepliesManager({ locale, initial }: { locale: Locale; initial: ChatSavedReply[] }) {
  const t = liveChatCopy[locale].inbox.saved;
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const set = (i: number, patch: Partial<Row>) => setRows((list) => list.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = async (i: number) => {
    const r = rows[i];
    const shortcut = r.shortcut.trim().toLowerCase().replace(/^\//, "");
    if (!/^[a-z0-9_-]{2,30}$/.test(shortcut)) return setErrors((e) => ({ ...e, [i]: t.invalidShortcut }));
    if (!r.title.trim() || !r.body.trim()) return;
    setBusy(i);
    const row = { title: r.title.trim(), shortcut, body: r.body.trim(), updated_at: new Date().toISOString() };
    const { data, error } = r.id
      ? await supabase.from("chat_saved_replies").update(row).eq("id", r.id).select().single()
      : await supabase.from("chat_saved_replies").insert(row).select().single();
    setBusy(null);
    if (error) return setErrors((e) => ({ ...e, [i]: error.code === "23505" ? t.duplicate : error.message }));
    setErrors((e) => {
      const copy = { ...e };
      delete copy[i];
      return copy;
    });
    set(i, { id: data.id, shortcut });
    router.refresh();
  };

  const remove = async (i: number) => {
    const r = rows[i];
    if (r.id) await supabase.from("chat_saved_replies").delete().eq("id", r.id);
    setRows((list) => list.filter((_, j) => j !== i));
    router.refresh();
  };

  return (
    <div className="grid max-w-4xl gap-4">
      {rows.length === 0 && <p className="rounded-lg bg-surface p-8 text-center text-sm text-muted shadow-meta dark:bg-card">{t.empty}</p>}
      {rows.map((r, i) => (
        <div key={r.id ?? `new-${i}`} className="grid gap-3 rounded-lg bg-surface p-5 shadow-meta sm:grid-cols-[minmax(0,1fr)_10rem] dark:bg-card">
          <label>
            <span className="mb-1 block text-xs font-semibold text-muted">{t.titleLabel}</span>
            <input value={r.title} onChange={(event) => set(i, { title: event.target.value })} maxLength={80} className={cn(inputClass, "h-10 text-sm")} />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-muted">{t.shortcut}</span>
            <span className="relative block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted">/</span>
              <input
                value={r.shortcut}
                onChange={(event) => set(i, { shortcut: event.target.value.toLowerCase() })}
                maxLength={30}
                className={cn(inputClass, "h-10 pl-6 font-mono text-sm")}
              />
            </span>
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-muted">{t.body}</span>
            <textarea
              value={r.body}
              onChange={(event) => set(i, { body: event.target.value })}
              rows={3}
              maxLength={2000}
              className={cn(inputClass, "h-auto resize-y py-2.5 text-sm leading-relaxed")}
            />
          </label>
          <div className="flex items-center gap-2 sm:col-span-2">
            <button type="button" onClick={() => save(i)} disabled={busy === i} className={buttonClasses("primary", "md", "h-10 px-5 disabled:opacity-60")}>
              {busy === i && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t.save}
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t.delete}
            </button>
            {errors[i] && (
              <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
                {errors[i]}
              </p>
            )}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setRows((list) => [...list, { title: "", shortcut: "", body: "" }])} className={buttonClasses("outline", "md", "w-fit")}>
        <Plus className="h-4 w-4" aria-hidden />
        {t.add}
      </button>
    </div>
  );
}
