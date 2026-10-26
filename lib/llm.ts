import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { IntegrationConfig } from "@/lib/integrations";

/**
 * Capa común para los modelos de lenguaje: Anthropic (Claude), OpenAI y
 * Google Gemini. Todos reciben lo mismo (instrucciones de sistema, mensajes,
 * límite de salida, JSON opcional) y devuelven texto plano, con errores
 * normalizados. Las llaves vienen de Integraciones (Vault) y solo se usan en
 * el servidor.
 */
export type Provider = "anthropic" | "openai" | "gemini";

export const PROVIDERS: Provider[] = ["anthropic", "openai", "gemini"];

export const PROVIDER_NAMES: Record<Provider, string> = { anthropic: "Claude", openai: "OpenAI", gemini: "Gemini" };

/** Modelos por defecto (se cambian en Integraciones con openai_model / gemini_model). */
export const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-opus-5-5",
  openai: "gpt-6-luna",
  gemini: "gemini-3.5-flash-lite",
};

export type LlmConfig = { provider: Provider; apiKey: string; model: string };
export type LlmMessage = { role: "user" | "assistant"; content: string };
export type LlmResult = { text: string; provider: Provider; model: string };

export type LlmErrorCode = "invalid_api_key" | "rate_limited" | "not_configured" | "refusal" | "timeout" | "provider_error";

export class LlmError extends Error {
  constructor(
    public code: LlmErrorCode,
    detail?: string,
  ) {
    super(detail ? `${code}: ${detail}` : code);
  }
}

const keyOf = (c: IntegrationConfig, p: Provider) =>
  p === "anthropic" ? c.anthropic_api_key : p === "openai" ? c.openai_api_key : c.gemini_api_key;

/** Proveedores que tienen llave configurada. */
export const configuredProviders = (c: IntegrationConfig) => PROVIDERS.filter((p) => !!keyOf(c, p));

/**
 * Proveedor a usar: el pedido, si no el predeterminado de Integraciones
 * (ai_provider), y si ese no tiene llave, el primero que sí la tenga.
 */
export function resolveLlm(c: IntegrationConfig, preferred?: string | null): LlmConfig | null {
  const order = [preferred, c.ai_provider, ...PROVIDERS].filter((p): p is Provider => PROVIDERS.includes(p as Provider));
  for (const provider of order) {
    const apiKey = keyOf(c, provider);
    if (!apiKey) continue;
    const model = (provider === "openai" ? c.openai_model : provider === "gemini" ? c.gemini_model : undefined) || DEFAULT_MODELS[provider];
    return { provider, apiKey, model };
  }
  return null;
}

/** Normaliza un error HTTP de OpenAI o Gemini. */
async function httpError(res: Response): Promise<LlmError> {
  const body = (await res.text().catch(() => "")).slice(0, 300);
  if (res.status === 401 || res.status === 403 || /API_KEY_INVALID|invalid api key|incorrect api key/i.test(body)) return new LlmError("invalid_api_key");
  if (res.status === 429) return new LlmError("rate_limited");
  return new LlmError("provider_error", `${res.status} ${body}`);
}

async function anthropicGenerate(cfg: LlmConfig, system: string, messages: LlmMessage[], maxTokens: number, signal: AbortSignal) {
  const client = new Anthropic({ apiKey: cfg.apiKey });
  try {
    const response = await client.beta.messages.create(
      {
        model: cfg.model,
        max_tokens: maxTokens,
        // Tareas cortas de redacción: esfuerzo bajo para responder rápido y gastar poco.
        output_config: { effort: "low" },
        // Si el modelo declina por seguridad, Anthropic reintenta con su modelo de respaldo.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system,
        messages,
      },
      { signal },
    );
    if (response.stop_reason === "refusal") throw new LlmError("refusal");
    return response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
  } catch (error) {
    if (error instanceof LlmError) throw error;
    if (error instanceof Anthropic.AuthenticationError) throw new LlmError("invalid_api_key");
    if (error instanceof Anthropic.RateLimitError) throw new LlmError("rate_limited");
    if (error instanceof Anthropic.APIUserAbortError) throw new LlmError("timeout");
    if (error instanceof Anthropic.APIError) throw new LlmError("provider_error", `${error.status ?? ""} ${error.message}`.trim());
    throw error;
  }
}

/** OpenAI: API de Respuestas (POST /v1/responses). */
async function openaiGenerate(cfg: LlmConfig, system: string, messages: LlmMessage[], maxTokens: number, json: boolean, signal: AbortSignal) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: cfg.model,
      instructions: system,
      input: messages.map((m) => ({ role: m.role, content: m.content })),
      max_output_tokens: maxTokens,
      ...(json ? { text: { format: { type: "json_object" } } } : {}),
      store: false,
    }),
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw await httpError(res);
  const body = (await res.json()) as {
    output?: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[];
  };
  const parts = (body.output ?? []).filter((o) => o.type === "message").flatMap((o) => o.content ?? []);
  if (parts.some((p) => p.type === "refusal") && !parts.some((p) => p.type === "output_text")) throw new LlmError("refusal");
  return parts
    .filter((p) => p.type === "output_text")
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

/** Google Gemini: generateContent. */
async function geminiGenerate(cfg: LlmConfig, system: string, messages: LlmMessage[], maxTokens: number, json: boolean, signal: AbortSignal) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": cfg.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: maxTokens, ...(json ? { responseMimeType: "application/json" } : {}) },
    }),
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw await httpError(res);
  const body = (await res.json()) as {
    promptFeedback?: { blockReason?: string };
    candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
  };
  if (body.promptFeedback?.blockReason) throw new LlmError("refusal");
  const candidate = body.candidates?.[0];
  if (!candidate || candidate.finishReason === "SAFETY") throw new LlmError("refusal");
  return (candidate.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

/**
 * Respuesta simulada SOLO para pruebas locales (LLM_FAKE=1 fuera de
 * producción): permite probar el flujo sin llaves ni costo.
 */
function fakeGenerate(messages: LlmMessage[], json: boolean) {
  const last = messages.at(-1)?.content ?? "";
  if (!json) return `[simulado] ${last.slice(-80)}`;
  if (/"options"/.test(last)) return JSON.stringify({ options: ["[simulado] Opción 1", "[simulado] Opción 2", "[simulado] Opción 3"] });
  if (/"intent"/.test(last)) return JSON.stringify({ intent: "cotizacion", service: "cloud-devops", confidence: "media", summary: "[simulado] Pide cotización." });
  const human = /asesor|humano|persona/i.test(last);
  return JSON.stringify({ reply: human ? "[simulado] Te comunico con un asesor." : "[simulado] Respuesta del asistente.", handoff: human, reason: human ? "Pide un asesor" : "" });
}

/** Genera texto con el proveedor indicado. Lanza LlmError si algo falla. */
export async function generate({
  config,
  system,
  messages,
  maxTokens = 1500,
  json = false,
  timeoutMs = 45_000,
}: {
  config: LlmConfig;
  system: string;
  messages: LlmMessage[];
  maxTokens?: number;
  json?: boolean;
  timeoutMs?: number;
}): Promise<LlmResult> {
  if (process.env.LLM_FAKE === "1" && process.env.NODE_ENV !== "production") {
    return { text: fakeGenerate(messages, json), provider: config.provider, model: `${config.model} (simulado)` };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const text =
      config.provider === "anthropic"
        ? await anthropicGenerate(config, system, messages, maxTokens, controller.signal)
        : config.provider === "openai"
          ? await openaiGenerate(config, system, messages, maxTokens, json, controller.signal)
          : await geminiGenerate(config, system, messages, maxTokens, json, controller.signal);
    if (!text) throw new LlmError("refusal");
    return { text, provider: config.provider, model: config.model };
  } catch (error) {
    if (error instanceof LlmError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new LlmError("timeout");
    throw new LlmError("provider_error", error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timer);
  }
}

/** Extrae el primer objeto JSON de un texto (algunos modelos lo envuelven en ```). */
export function parseJson(text: string): unknown {
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new LlmError("provider_error", "invalid_json");
  }
}

/** Código de error para responder al navegador (nunca incluye secretos). */
export const llmErrorCode = (error: unknown) => (error instanceof LlmError ? error.code : "provider_error");
