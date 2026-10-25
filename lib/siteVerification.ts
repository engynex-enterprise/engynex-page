import "server-only";

/**
 * Códigos de verificación de Google Search Console y Bing Webmaster,
 * guardados en Integraciones. Se leen con la clave pública y se cachean una
 * hora (las páginas siguen siendo estáticas y se regeneran solas).
 */
async function publicTagConfig(): Promise<Record<string, string> | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/public_tag_config`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: "{}",
      next: { revalidate: 3600, tags: ["integrations"] },
    });
    return res.ok ? ((await res.json()) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

export async function siteVerification(): Promise<{ google?: string; bing?: string }> {
  const c = await publicTagConfig();
  return {
    google: c?.gsc_verification || process.env.GOOGLE_SITE_VERIFICATION || undefined,
    bing: c?.bing_verification || process.env.BING_SITE_VERIFICATION || undefined,
  };
}

/** ID del contenedor de Tag Manager (para el <noscript> del <body>). */
export async function gtmContainerId(): Promise<string | undefined> {
  const c = await publicTagConfig();
  const id = c?.gtm_id || process.env.NEXT_PUBLIC_GTM_ID || "";
  return /^GTM-[A-Z0-9]{4,12}$/.test(id) ? id : undefined;
}
