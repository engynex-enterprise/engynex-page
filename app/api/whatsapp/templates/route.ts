import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { countVariables, listTemplates, whatsappMissing } from "@/lib/whatsapp";

/** Trae las plantillas de la cuenta de WhatsApp Business y las guarda. */
export async function POST() {
  const session = await apiProfile(["admin", "marketing"]);
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const missing = await whatsappMissing();
  if (missing.length) return NextResponse.json({ error: "not_configured", missing }, { status: 409 });

  try {
    const templates = await listTemplates();
    const rows = templates.map((t) => {
      const part = (type: string) => t.components?.find((c) => c.type === type);
      const header = part("HEADER");
      const body = part("BODY")?.text ?? "";
      return {
        meta_id: t.id,
        name: t.name,
        language: t.language,
        category: t.category ?? null,
        status: t.status,
        header: header?.format === "TEXT" ? (header.text ?? null) : header ? `[${header.format}]` : null,
        body,
        footer: part("FOOTER")?.text ?? null,
        variables: countVariables(body),
        synced_at: new Date().toISOString(),
      };
    });
    if (rows.length) {
      const { error } = await createAdminClient().from("wa_templates").upsert(rows, { onConflict: "name,language" });
      if (error) throw new Error(error.message);
    }
    return NextResponse.json({ ok: true, count: rows.length });
  } catch (error) {
    return NextResponse.json(
      { error: "sync_failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
