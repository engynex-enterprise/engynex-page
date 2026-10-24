"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Mientras una campaña se envía, refresca el informe: al cambiar la campaña
 * (tiempo real) y cada pocos segundos para los estados de entrega.
 */
export function CampaignLive({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`campaign-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "wa_campaigns", filter: `id=eq.${id}` }, () =>
        router.refresh(),
      )
      .subscribe();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, active ? 5000 : 30000);
    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [id, active, router]);
  return null;
}
