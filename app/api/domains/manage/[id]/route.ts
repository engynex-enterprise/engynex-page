import { NextResponse } from "next/server";
import { apiProfile } from "@/lib/apiAuth";
import {
  deleteDnsRecords,
  getAuthCode,
  getDnsZone,
  getDomainDetails,
  getRenewalInfo,
  setLock,
  setNameservers,
  setPrivacy,
  updateDnsZone,
} from "@/lib/domains";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLES = ["client", "provider", "admin", "sales", "support", "marketing"] as const;
const STAFF = new Set(["admin", "sales", "support", "marketing"]);
const TYPES = new Set(["A", "AAAA", "CNAME", "MX", "TXT", "SRV", "CAA", "ALIAS"]);
const HOST = /^(@|\*|[a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9_])?(\.[a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9_])?)*)$/i;

async function load(id: string) {
  const session = await apiProfile([...ROLES]);
  if (!session) return { error: NextResponse.json({ error: "login_required" }, { status: 401 }) };
  const db = createAdminClient();
  const { data: d } = await db.from("client_domains").select("*").eq("id", id).maybeSingle();
  if (!d || (d.owner_id !== session.profile.id && !STAFF.has(session.profile.role))) return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  return { db, d, session };
}

const fail = (e: unknown) => NextResponse.json({ error: e instanceof Error ? e.message.replace(/^hostinger \d+: /, "") : "error" }, { status: 502 });

/** Estado actual del dominio en el registrador (y se sincroniza la ficha). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const r = await load((await ctx.params).id);
  if ("error" in r) return r.error;
  const { db, d } = r;
  // Dominio simulado por un pago de prueba: no existe en el registrador.
  if (d.is_test) {
    return NextResponse.json({
      test: true,
      details: { domain: d.domain, status: "active", is_privacy_protection_allowed: true, is_privacy_protected: d.privacy, is_lockable: true, is_locked: d.locked, name_servers: { ns1: "ns1.dns-parking.com", ns2: "ns2.dns-parking.com" } },
      dns: [],
      expires_at: d.expires_at,
    });
  }
  try {
    const [details, dns, renewal] = await Promise.all([
      getDomainDetails(d.domain),
      getDnsZone(d.domain).catch(() => []),
      getRenewalInfo(d.domain).catch(() => null),
    ]);
    const expires = renewal?.expires_at ? new Date(renewal.expires_at.replace(" ", "T") + "Z").toISOString() : d.expires_at;
    await db
      .from("client_domains")
      .update({ privacy: details.is_privacy_protected, locked: details.is_locked, expires_at: expires, last_synced_at: new Date().toISOString() })
      .eq("id", d.id);
    return NextResponse.json({ details, dns, expires_at: expires });
  } catch (e) {
    return fail(e);
  }
}

type Action =
  | { type: "privacy"; on: boolean }
  | { type: "lock"; on: boolean }
  | { type: "auto_renew"; on: boolean }
  | { type: "nameservers"; ns: { ns1: string; ns2: string; ns3?: string; ns4?: string } }
  | { type: "dns_upsert"; record: { name: string; type: string; ttl?: number; values: string[] } }
  | { type: "dns_delete"; record: { name: string; type: string } }
  | { type: "auth_code" };

/** Cambios del cliente sobre su dominio. */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const r = await load((await ctx.params).id);
  if ("error" in r) return r.error;
  const { db, d } = r;
  const a = (await request.json().catch(() => null)) as Action | null;
  if (!a) return NextResponse.json({ error: "invalid" }, { status: 422 });
  if (d.is_test && a.type !== "auto_renew") {
    return NextResponse.json({ error: "Dominio de prueba (pago sandbox): estos cambios solo aplican a dominios comprados de verdad." }, { status: 409 });
  }
  try {
    switch (a.type) {
      case "privacy":
        await setPrivacy(d.domain, !!a.on);
        await db.from("client_domains").update({ privacy: !!a.on }).eq("id", d.id);
        return NextResponse.json({ ok: true });
      case "lock":
        await setLock(d.domain, !!a.on);
        await db.from("client_domains").update({ locked: !!a.on }).eq("id", d.id);
        return NextResponse.json({ ok: true });
      case "auto_renew":
        await db.from("client_domains").update({ auto_renew: !!a.on }).eq("id", d.id);
        return NextResponse.json({ ok: true });
      case "nameservers": {
        const ns = Object.fromEntries(Object.entries(a.ns ?? {}).map(([k, v]) => [k, String(v).trim().toLowerCase()]).filter(([, v]) => v)) as { ns1: string; ns2: string };
        if (!ns.ns1 || !ns.ns2 || Object.values(ns).some((v) => !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(v))) return NextResponse.json({ error: "invalid" }, { status: 422 });
        await setNameservers(d.domain, ns);
        return NextResponse.json({ ok: true });
      }
      case "dns_upsert": {
        const rec = a.record;
        const values = (rec?.values ?? []).map((v) => String(v).trim()).filter(Boolean).slice(0, 10);
        if (!rec || !HOST.test(rec.name) || !TYPES.has(rec.type) || !values.length) return NextResponse.json({ error: "invalid" }, { status: 422 });
        await updateDnsZone(d.domain, [{ name: rec.name, type: rec.type, ttl: Math.min(Math.max(Number(rec.ttl) || 14400, 60), 86400), records: values.map((content) => ({ content })) }], true);
        return NextResponse.json({ ok: true });
      }
      case "dns_delete":
        if (!a.record || !HOST.test(a.record.name) || !TYPES.has(a.record.type)) return NextResponse.json({ error: "invalid" }, { status: 422 });
        await deleteDnsRecords(d.domain, [{ name: a.record.name, type: a.record.type }]);
        return NextResponse.json({ ok: true });
      case "auth_code":
        return NextResponse.json(await getAuthCode(d.domain));
      default:
        return NextResponse.json({ error: "invalid" }, { status: 422 });
    }
  } catch (e) {
    return fail(e);
  }
}
