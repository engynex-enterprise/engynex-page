import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplate } from "@/lib/whatsapp";

const BATCH = 100;
const CONCURRENCY = 8;

/**
 * Envía mensajes de campaña pendientes (y arranca las programadas que ya
 * tocan) hasta agotar la cola o el tiempo disponible.
 */
export async function dispatchWhatsApp(budgetMs: number) {
  const db = createAdminClient();
  const started = Date.now();
  let sent = 0;
  let failed = 0;

  while (Date.now() - started < budgetMs) {
    const { data: batch, error } = await db.rpc("wa_claim_batch", { p_limit: BATCH });
    if (error) throw new Error(error.message);
    if (!batch?.length) break;

    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      await Promise.all(
        batch.slice(i, i + CONCURRENCY).map(async (m) => {
          try {
            const id = await sendTemplate(m.phone, m.template, m.language, (m.params as string[]) ?? []);
            await db.rpc("wa_mark_sent", { p_id: m.id, p_wa_id: id });
            sent++;
          } catch (err) {
            await db.rpc("wa_mark_sent", { p_id: m.id, p_wa_id: null, p_error: err instanceof Error ? err.message : String(err) });
            failed++;
          }
        }),
      );
    }
  }
  return { sent, failed };
}
