import { Mail } from "lucide-react";
import { WhatsappIcon } from "@/components/SocialIcons";
import type { CampaignChannel } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/** Fila de campaign_stats (sirve para WhatsApp y correo). */
export type CampaignStats = {
  campaign_id: string;
  sent: number;
  delivered: number;
  /** WhatsApp: leídos · Correo: abiertos. */
  opened: number;
  /** WhatsApp: respondieron · Correo: clics. */
  engaged: number;
  failed: number;
  pending: number;
  unsubscribed: number;
};

/** Ícono del canal en un círculo de color. */
export function ChannelIcon({ channel, className }: { channel: CampaignChannel; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-full",
        channel === "whatsapp" ? "bg-[#25D366]/15 text-[#128c4a] dark:text-[#25D366]" : "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
        className,
      )}
    >
      {channel === "whatsapp" ? <WhatsappIcon className="h-4 w-4" /> : <Mail className="h-4 w-4" aria-hidden />}
    </span>
  );
}

/** Porcentaje entero o "—". */
export const pct = (n: number | null | undefined, d: number | null | undefined) => (d ? `${Math.round(((n ?? 0) / d) * 100)}%` : "—");
