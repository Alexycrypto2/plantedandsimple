import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const GEMINI_OPENAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
export const DEFAULT_GEMINI_TEXT_MODEL = "gemini-2.5-flash";
export const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
export const DEFAULT_CHAT_MODEL = DEFAULT_GEMINI_TEXT_MODEL;
export const DEFAULT_IMAGE_MODEL = DEFAULT_GEMINI_IMAGE_MODEL;

export type AiCapability = "text" | "image";
export type AiProviderKey = "gemini_direct" | "lovable_gateway" | "magic_hour";
export type AiModelRecord = {
  provider: AiProviderKey;
  modelId: string;
  label: string;
  capabilities: AiCapability[];
  fallbackRank: number;
  configured: boolean;
};

/** The safe, code-level registry is always available; the database registry enriches it when migrated. */
export const AI_MODEL_REGISTRY: AiModelRecord[] = [
  { provider: "gemini_direct", modelId: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image", capabilities: ["image"], fallbackRank: 10, configured: false },
  { provider: "gemini_direct", modelId: "gemini-3.1-flash-image", label: "Gemini 3.1 Flash Image", capabilities: ["image"], fallbackRank: 20, configured: false },
  { provider: "gemini_direct", modelId: "gemini-3-pro-image", label: "Gemini 3 Pro Image", capabilities: ["image"], fallbackRank: 30, configured: false },
  { provider: "lovable_gateway", modelId: "google/gemini-3.1-flash-image", label: "Gateway · Gemini 3.1 Flash Image", capabilities: ["image"], fallbackRank: 40, configured: true },
  { provider: "lovable_gateway", modelId: "google/gemini-3-pro-image", label: "Gateway · Gemini 3 Pro Image", capabilities: ["image"], fallbackRank: 50, configured: true },
];

/** Preserve the admin's Google model choice; Google's catalog changes frequently. */
export function normalizeGeminiTextModel(raw?: string | null): string {
  const id = (raw ?? "").trim().replace(/^google\//, "");
  return id || DEFAULT_GEMINI_TEXT_MODEL;
}

export function normalizeGeminiImageModel(raw?: string | null): string {
  const id = (raw ?? "").trim().replace(/^google\//, "");
  return id.startsWith("gemini-") && id.includes("image") ? id : DEFAULT_GEMINI_IMAGE_MODEL;
}

export type AiProviderName = "gemini";

export type AiProviderInfo = {
  provider: AiProviderName;
  modelId: string;
  keySource: "admin_settings" | "environment";
};

export type AiBudgetMode = "economy" | "balanced" | "quality" | "automatic";

const COMPLEX_FEATURES = new Set(["campaign", "blog-core", "blog-studio", "recipe-studio"]);
const FAST_FEATURES = new Set(["topics", "quality", "pin-studio", "pin-studio-source", "assistant", "diagnostics"]);

function normalizeBudget(raw?: string | null): AiBudgetMode {
  return raw === "economy" || raw === "balanced" || raw === "quality" ? raw : "automatic";
}

function automaticTextModel(feature: string, budget: AiBudgetMode): string {
  if (budget === "economy") return "gemini-2.5-flash-lite";
  if (budget === "quality") return COMPLEX_FEATURES.has(feature) ? "gemini-2.5-pro" : "gemini-2.5-flash";
  if (FAST_FEATURES.has(feature)) return "gemini-2.5-flash";
  if (COMPLEX_FEATURES.has(feature)) return budget === "balanced" ? "gemini-2.5-flash" : "gemini-2.5-pro";
  return "gemini-2.5-flash";
}

export function aiRecommendationSummary(input: { mode?: string | null; budget?: string | null }) {
  const mode = input.mode === "manual" ? "manual" : "automatic";
  const budget = normalizeBudget(input.budget);
  return {
    mode,
    budget,
    provider: "Gemini",
    recommendations: {
      blog: automaticTextModel("blog-core", budget),
      recipe: automaticTextModel("recipe-studio", budget),
      seo: automaticTextModel("quality", budget),
      pinterest_copy: automaticTextModel("pin-studio", budget),
      campaign: automaticTextModel("campaign", budget),
      images: "Selected Gemini model, then the configured fallback chain",
    },
    alternatives: [
      { label: "Best quality", model: "gemini-2.5-pro", use: "Long-form blogs and complex campaigns" },
      { label: "Best value", model: "gemini-2.5-flash", use: "Blogs, recipes, SEO and Pinterest copy" },
      { label: "Fallback", model: "Gateway Gemini image models", use: "Continues pin previews when direct image quota is blocked" },
    ],
  };
}

/** Reads the Gemini key from admin settings first, then env (GEMINI_API_KEY / GOOGLE_API_KEY). */
export async function resolveGeminiKey(): Promise<{ key: string; source: "admin_settings" | "environment" } | null> {
  const { getConfig } = await import("../settings.server");
  const fromDb = await getConfig("GEMINI_API_KEY");
  if (fromDb) {
    const isEnv = process.env.GEMINI_API_KEY === fromDb;
    return { key: fromDb, source: isEnv ? "environment" : "admin_settings" };
  }
  const env = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return env ? { key: env, source: "environment" } : null;
}

/** Turns provider/gateway failures into an error the admin can act on. */
export function describeAiError(err: unknown, info?: AiProviderInfo): Error {
  const raw = err instanceof Error ? err.message : String(err);
  const status = (err as any)?.statusCode ?? (err as any)?.status;
  const body =
    typeof (err as any)?.responseBody === "string" ? (err as any).responseBody.slice(0, 500) : "";
  const where = info ? `${info.provider} · ${info.modelId}` : "AI provider";
  if (status === 402 || /payment_required|Not enough credits/i.test(raw + body)) {
    return new Error(
      `Gemini billing or quota is unavailable (402). Check this API key's Google AI billing and quota. [${where}]`,
    );
  }
  if (status === 401 || status === 403 || /API_KEY_INVALID|PERMISSION_DENIED|Unauthorized/i.test(raw + body)) {
    return new Error(`AI key rejected by ${where}: ${body || raw}`);
  }
  if (status === 404 || /NOT_FOUND|is not found for API version|model/i.test(body)) {
    return new Error(`Model not available for this key — ${where}: ${body || raw}`);
  }
  if (status === 429) return new Error(`Rate limited by ${where}: ${body || raw}`);
  return new Error(`${where} failed: ${body || raw}`);
}

function logAi(stage: string, fields: Record<string, unknown>) {
  console.log(`[ai] ${stage} ${JSON.stringify(fields)}`);
}

/**
 * THE single place every AI text feature resolves its provider.
 * Every feature uses the administrator's Gemini key directly. There is no fallback provider.
 */
export async function resolveTextModel(opts?: { structuredOutputs?: boolean; feature?: string }) {
  const structuredOutputs = opts?.structuredOutputs ?? true;
  const gemini = await resolveGeminiKey();

  if (!gemini) throw new Error("Gemini API key is missing. Add it in Admin → Settings → Integrations, then run the live test.");
  const { getConfig } = await import("../settings.server");
  const feature = opts?.feature ?? "unknown";
  const mode = (await getConfig("AI_MODE")) === "manual" ? "manual" : "automatic";
  const budget = normalizeBudget(await getConfig("AI_BUDGET_MODE"));
  const modelId = mode === "manual"
    ? normalizeGeminiTextModel(await getConfig("GEMINI_TEXT_MODEL"))
    : automaticTextModel(feature, budget);
  const info: AiProviderInfo = { provider: "gemini", modelId, keySource: gemini.source };
  logAi("request", { feature, mode, budget, ...info });
  const provider = createOpenAICompatible({
    name: "google",
    baseURL: GEMINI_OPENAI_URL,
    supportsStructuredOutputs: structuredOutputs,
    headers: { Authorization: `Bearer ${gemini.key}` },
  });
  return { model: withBusyFallback(provider, modelId), info };
}

/** When Google says a model is busy (503/429/overloaded), quietly try the next Gemini model. */
const BUSY_FALLBACKS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
function isBusy(err: unknown) {
  const status = (err as any)?.statusCode ?? (err as any)?.status;
  const text = String((err as any)?.message ?? err);
  return status === 503 || status === 429 || status === 500 || /unavailable|overloaded|high demand|resource.?exhausted/i.test(text);
}
function withBusyFallback(provider: (id: string) => any, primary: string) {
  const chain = [primary, ...BUSY_FALLBACKS.filter((m) => m !== primary)];
  const base = provider(primary);
  const attempt = async (method: "doGenerate" | "doStream", options: any) => {
    let last: unknown;
    for (const id of chain) {
      try {
        return await provider(id)[method](options);
      } catch (err) {
        last = err;
        if (!isBusy(err)) throw err;
        logAi("busy-fallback", { from: id });
      }
    }
    throw last;
  };
  return new Proxy(base, {
    get(target, prop, receiver) {
      if (prop === "doGenerate" || prop === "doStream") return (options: any) => attempt(prop, options);
      return Reflect.get(target, prop, receiver);
    },
  });
}

export async function textModel(feature?: string, structuredOutputs = true) {
  const { model } = await resolveTextModel({ structuredOutputs, feature });
  return model;
}

export async function runAi<T>(feature: string, fn: (model: any) => Promise<T>): Promise<T> {
  const { model, info } = await resolveTextModel({ structuredOutputs: true, feature });
  const started = Date.now();
  try {
    const out = await fn(model);
    logAi("ok", { feature, ...info, ms: Date.now() - started });
    return out;
  } catch (err) {
    logAi("error", {
      feature,
      ...info,
      ms: Date.now() - started,
      status: (err as any)?.statusCode ?? (err as any)?.status ?? null,
      body: String((err as any)?.responseBody ?? (err as Error)?.message ?? err).slice(0, 600),
    });
    throw describeAiError(err, info);
  }
}

export async function aiProviderSnapshot() {
  const gemini = await resolveGeminiKey();
  const { getConfig } = await import("../settings.server");
  return {
    text_provider: "gemini",
    text_model: normalizeGeminiTextModel(await getConfig("GEMINI_TEXT_MODEL")),
    image_provider: "magic_hour",
    image_model: "ai-photo-generator",
    gemini_key_present: Boolean(gemini),
    gemini_key_source: gemini?.source ?? null,
  };
}

/** All site photography (recipes, blogs, pins) is generated by Magic Hour. */
export async function generateImageBase64(
  prompt: string,
  opts?: { feature?: string; requestedModel?: string; requestedProvider?: AiProviderKey; requestedBy?: string; aspectRatio?: string },
): Promise<{ base64: string; mime: string; provider: AiProviderKey; modelId: string; fallback: boolean }> {
  const { getConfig } = await import("../settings.server");
  const key = await getConfig("MAGIC_HOUR_API_KEY");
  const feature = opts?.feature ?? "image";
  if (!key) throw new Error("Add your Magic Hour API key in Connections to generate photos.");
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const aspect = opts?.aspectRatio ?? (/2:3|vertical|Pinterest/i.test(prompt) ? "9:16" : /4:5/.test(prompt) ? "4:5" : "16:9");
  try {
    const start = await fetch("https://api.magichour.ai/v1/ai-image-generator", {
      method: "POST",
      headers,
      body: JSON.stringify({ image_count: 1, aspect_ratio: aspect, model: "default", style: { prompt: prompt.slice(0, 4000), tool: "ai-photo-generator" } }),
    });
    const started = (await start.json().catch(() => ({}))) as any;
    if (!start.ok || !started.id) throw Object.assign(new Error(started.message ?? `Magic Hour returned ${start.status}`), { status: start.status });
    let url: string | undefined;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const poll = await fetch(`https://api.magichour.ai/v1/image-projects/${encodeURIComponent(started.id)}`, { headers });
      const body = (await poll.json().catch(() => ({}))) as any;
      if (!poll.ok) throw Object.assign(new Error(body.message ?? `Magic Hour returned ${poll.status}`), { status: poll.status });
      if (body.status === "error" || body.status === "failed" || body.status === "canceled") throw new Error(String(body.error?.message ?? body.error ?? "Magic Hour could not create this image"));
      if (body.status === "complete") { url = body.downloads?.[0]?.url; break; }
    }
    if (!url) throw new Error("Magic Hour took too long to finish this image.");
    const file = await fetch(url);
    if (!file.ok) throw new Error("Could not download the Magic Hour image.");
    const mime = (file.headers.get("Content-Type") ?? "image/png").split(";")[0];
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    await recordAiUsage({ feature, operation: "generate", provider: "magic_hour", modelId: "ai-photo-generator", outcome: "success", requestedBy: opts?.requestedBy });
    return { base64, mime, provider: "magic_hour", modelId: "ai-photo-generator", fallback: false };
  } catch (err) {
    const status = (err as any)?.status;
    await recordAiUsage({ feature, operation: "generate", provider: "magic_hour", modelId: "ai-photo-generator", outcome: "failed", statusCode: status, errorMessage: String((err as Error)?.message ?? err).slice(0, 300), requestedBy: opts?.requestedBy });
    throw new Error(`Magic Hour image failed: ${(err as Error)?.message ?? err}`);
  }
}

export async function recordAiUsage(input: { feature: string; operation: string; provider: AiProviderKey; modelId: string; outcome: "success" | "failed" | "fallback"; statusCode?: number; errorMessage?: string; requestedBy?: string }) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from("ai_usage_ledger").insert({
      feature: input.feature, operation: input.operation, provider_key: input.provider, model_id: input.modelId,
      outcome: input.outcome, estimated_credits: input.outcome === "failed" ? 0 : 1,
      status_code: input.statusCode ?? null, error_message: input.errorMessage ?? null,
      requested_by: input.requestedBy ?? null, metadata: { tracked_by: "central-ai-router" },
    });
  } catch (err) {
    console.warn(`[ai] usage ledger unavailable: ${String((err as Error)?.message ?? err).slice(0, 180)}`);
  }
}

export async function aiRegistrySnapshot() {
  const gemini = await resolveGeminiKey();
  return AI_MODEL_REGISTRY.map((model) => ({ ...model, configured: model.provider === "gemini_direct" ? Boolean(gemini) : Boolean(process.env["LOVABLE_API_KEY"]) }));
}
