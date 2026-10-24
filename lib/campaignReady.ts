import "server-only";
import type { CampaignChannel } from "@/lib/supabase/types";
import { hasSecretKey, integrationStatus } from "@/lib/integrations";
import { whatsappMissingFrom } from "@/lib/whatsapp";

/** ¿El canal está listo para enviar? (WhatsApp o Resend + clave del servidor). */
export async function channelReady(supabase: Parameters<typeof integrationStatus>[0], channel: CampaignChannel) {
  const status = await integrationStatus(supabase);
  if (channel === "whatsapp") return whatsappMissingFrom(status, hasSecretKey()).length === 0;
  return !!status.resend_api_key && !!status.email_from && hasSecretKey();
}
