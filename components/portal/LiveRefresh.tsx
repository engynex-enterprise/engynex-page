"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Vuelve a pedir los datos de la página (Server Components) cuando cambia
 * alguna de estas tablas. RLS decide qué cambios llegan a cada usuario.
 */
export function LiveRefresh({ tables, channel }: { tables: string[]; channel: string }) {
  const router = useRouter();
  const key = tables.join(",");
  useEffect(() => {
    const supabase = createClient();
    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => router.refresh(), 400);
    };
    let ch = supabase.channel(channel);
    for (const table of key.split(",")) {
      ch = ch.on("postgres_changes", { event: "*", schema: "public", table }, refresh);
    }
    ch.subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(ch);
    };
  }, [key, channel, router]);
  return null;
}
