"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";

/** Genera (o rehace) el informe de la semana pasada, sin enviarlo por correo. */
export function GenerateReportButton({ weekStart, label, busyLabel }: { weekStart: string; label: string; busyLabel: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const { data } = await createClient().rpc("report_generate", { p_week_start: weekStart, p_email: false });
        setBusy(false);
        if (data) router.push(`?r=${data}`);
        router.refresh();
      }}
      className={buttonClasses("outline", "md", "disabled:opacity-60")}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {busy ? busyLabel : label}
    </button>
  );
}
