import { MessageCircle } from "lucide-react";
import { InstagramIcon, WhatsappIcon } from "@/components/SocialIcons";
import type { ChatChannel } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/** Insignia del canal sobre el avatar (el chat del sitio no lleva). */
export function ChannelBadge({ channel, className }: { channel: ChatChannel; className?: string }) {
  if (channel === "web") return null;
  const tone =
    channel === "whatsapp"
      ? "bg-[#25D366] text-deep-950"
      : channel === "messenger"
        ? "bg-[#0084ff] text-white"
        : "bg-[linear-gradient(45deg,#f9a825,#e91e63_55%,#7b1fa2)] text-white";
  return (
    <span className={cn("grid h-[18px] w-[18px] place-items-center rounded-full ring-2 ring-surface dark:ring-card", tone, className)}>
      {channel === "whatsapp" ? (
        <WhatsappIcon className="h-2.5 w-2.5" />
      ) : channel === "messenger" ? (
        <MessageCircle className="h-2.5 w-2.5" aria-hidden />
      ) : (
        <InstagramIcon className="h-2.5 w-2.5" />
      )}
    </span>
  );
}
