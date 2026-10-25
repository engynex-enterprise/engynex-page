/**
 * Reconoce los IDs dentro de los códigos de instalación que entregan Google,
 * Meta, Microsoft, LinkedIn y TikTok, para que se puedan pegar tal cual en
 * Integraciones. El sitio no inserta el código pegado: carga sus propias
 * versiones con Consent Mode (solo después de aceptar cookies).
 */
export type SnippetKey =
  | "gtm_id"
  | "ga4_id"
  | "google_ads_id"
  | "meta_pixel_id"
  | "clarity_id"
  | "linkedin_partner_id"
  | "tiktok_pixel_id"
  | "gsc_verification"
  | "bing_verification";

const PATTERNS: Record<SnippetKey, RegExp[]> = {
  gtm_id: [/\b(GTM-[A-Z0-9]{4,12})\b/],
  ga4_id: [/\b(G-[A-Z0-9]{4,16})\b/],
  google_ads_id: [/\b(AW-[0-9]{6,14})\b/],
  meta_pixel_id: [/fbq\(\s*['"]init['"]\s*,\s*['"]([0-9]{6,20})['"]/, /facebook\.com\/tr\?id=([0-9]{6,20})/, /^\s*([0-9]{6,20})\s*$/],
  clarity_id: [/["']clarity["']\s*,\s*["']script["']\s*,\s*["']([a-z0-9]{6,20})["']/, /clarity\.ms\/tag\/([a-z0-9]{6,20})/, /^\s*([a-z0-9]{6,20})\s*$/],
  linkedin_partner_id: [/_linkedin_partner_id\s*=\s*["']?([0-9]{4,12})/, /pid=([0-9]{4,12})/, /^\s*([0-9]{4,12})\s*$/],
  tiktok_pixel_id: [/ttq\.load\(\s*['"]([A-Z0-9]{10,30})['"]/, /sdkid=([A-Z0-9]{10,30})/, /^\s*([A-Z0-9]{10,30})\s*$/],
  gsc_verification: [/google-site-verification["']?\s+content=["']([A-Za-z0-9_-]{20,80})["']/, /content=["']([A-Za-z0-9_-]{20,80})["']\s+name=["']google-site-verification/, /^\s*([A-Za-z0-9_-]{20,80})\s*$/],
  bing_verification: [/msvalidate\.01["']?\s+content=["']([A-Fa-f0-9]{32})["']/, /content=["']([A-Fa-f0-9]{32})["']\s+name=["']msvalidate\.01/, /^\s*([A-Fa-f0-9]{32})\s*$/],
};

/** IDs encontrados en el texto pegado, solo de las claves pedidas. */
export function detectIds(text: string, keys: SnippetKey[]): Partial<Record<SnippetKey, string>> {
  const found: Partial<Record<SnippetKey, string>> = {};
  for (const key of keys) {
    for (const re of PATTERNS[key]) {
      const m = text.match(re);
      if (m?.[1]) {
        found[key] = m[1];
        break;
      }
    }
  }
  return found;
}

/** Claves que se pueden instalar pegando el código, por integración. */
export const SNIPPET_KEYS: Record<string, SnippetKey[]> = {
  "google-tag-manager": ["gtm_id"],
  "google-analytics": ["ga4_id"],
  "google-ads": ["google_ads_id"],
  "meta-pixel": ["meta_pixel_id"],
  "microsoft-clarity": ["clarity_id"],
  "linkedin-insight": ["linkedin_partner_id"],
  "tiktok-pixel": ["tiktok_pixel_id"],
  "search-console": ["gsc_verification"],
  "bing-webmaster": ["bing_verification"],
};

/** El código equivalente que el sitio pone en cada página (para mostrarlo). */
export function installedSnippet(key: SnippetKey, id: string): string {
  switch (key) {
    case "gtm_id":
      return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');</script>
<!-- End Google Tag Manager -->`;
    case "ga4_id":
    case "google_ads_id":
      return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${id}');
</script>`;
    case "meta_pixel_id":
      return `<script>
!function(f,b,e,v,n,t,s){…}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
</script>`;
    case "clarity_id":
      return `<script type="text/javascript">
(function(c,l,a,r,i,t,y){…})(window, document, "clarity", "script", "${id}");
</script>`;
    case "linkedin_partner_id":
      return `<script type="text/javascript">
_linkedin_partner_id = "${id}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>
<script async src="https://snap.licdn.com/li.lms-analytics/insight.min.js"></script>`;
    case "tiktok_pixel_id":
      return `<script>
!function (w, d, t) {…}(window, document, 'ttq');
ttq.load('${id}');
ttq.page();
</script>`;
    case "gsc_verification":
      return `<meta name="google-site-verification" content="${id}" />`;
    case "bing_verification":
      return `<meta name="msvalidate.01" content="${id}" />`;
  }
}

/** El bloque del <body> de Tag Manager (noscript). */
export const gtmBodySnippet = (id: string) => `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

/** Las etiquetas de verificación van siempre; el resto, tras aceptar cookies. */
export const isVerification = (key: SnippetKey) => key === "gsc_verification" || key === "bing_verification";
