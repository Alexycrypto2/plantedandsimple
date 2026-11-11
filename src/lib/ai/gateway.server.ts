import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const GEMINI_OPENAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
export const DEFAULT_GEMINI_TEXT_MODEL = "gemini-3.8-flash";
export const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
export const DEFAULT_CHAT_MODEL = DEFAULT_GEMINI_TEXT_MODEL;
export const DEFAULT_IMAGE_MODEL = DEFAULT_GEMINI_IMAGE_MODEL;

export type AiCapability = "text" | "image";
export type AiProviderKey = "gemini_direct" | "lovable_gateway" | "magic_hour" | "fal" | "together" | "cloudflare";
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
  if (budget === "economy") return "gemini-3.8-flash-lite";
  if (budget === "quality") return COMPLEX_FEATURES.has(feature) ? "gemini-3.1-pro" : "gemini-3.8-flash";
  if (FAST_FEATURES.has(feature)) return "gemini-3.8-flash";
  if (COMPLEX_FEATURES.has(feature)) return budget === "balanced" ? "gemini-3.8-flash" : "gemini-3.1-pro";
  return "gemini-3.8-flash";
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
      { label: "Best quality", model: "gemini-3.1-pro", use: "Long-form blogs and complex campaigns" },
      { label: "Best value", model: "gemini-3.8-flash", use: "Blogs, recipes, SEO and Pinterest copy" },
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
  if (info?.provider !== ("claude" as any) && (status === 402 || /payment_required|Not enough credits/i.test(raw + body))) {
    return new Error(
      `Gemini billing or quota is unavailable (402). Check this API key's Google AI billing and quota. [${where}]`,
    );
  }
  if (status === 401 || status === 403 || /API_KEY_INVALID|PERMISSION_DENIED|Unauthorized/i.test(raw + body)) {
    return new Error(`AI key rejected by ${where}: ${body || raw}`);
  }
  if (status === 429 || /too many requests|quota|resource.?exhausted/i.test(raw + body)) return new Error("Google's AI is very busy right now and every backup model was too. Nothing was changed — please try again in a minute.");
  if (status === 503 || /high demand|overloaded|unavailable/i.test(raw + body)) return new Error("Google's AI is overloaded right now. Nothing was changed — please try again in a minute.");
  if (status === 404 || /NOT_FOUND|is not found for API version|model/i.test(body)) {
    return new Error(`Model not available for this key — ${where}: ${body || raw}`);
  }
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
  {
    const { getConfig } = await import("../settings.server");
    if ((await getConfig("AI_TEXT_PROVIDER"))?.trim().toLowerCase() === "claude") {
      const key = await getConfig("ANTHROPIC_API_KEY");
      if (!key) throw new Error("Claude is selected but the Claude API key is missing. Add it in Admin → Settings → Integrations.");
      const modelId = (await getConfig("CLAUDE_TEXT_MODEL"))?.trim().replace(/^anthropic\//, "") || "claude-sonnet-4-5";
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      const info = { provider: "claude", modelId, keySource: "admin_settings" } as unknown as AiProviderInfo;
      logAi("request", { feature: opts?.feature ?? "unknown", ...info });
      return { model: createAnthropic({ apiKey: key })(modelId) as any, info };
    }
  }
  const gemini = await resolveGeminiKey();

  if (!gemini) throw new Error("Gemini API key is missing. Add it in Admin → Settings → Integrations, then run the live test.");
  const { getConfig } = await import("../settings.server");
  const feature = opts?.feature ?? "unknown";
  const mode = (await getConfig("AI_MODE")) === "manual" ? "manual" : "automatic";
  const budget = normalizeBudget(await getConfig("AI_BUDGET_MODE"));
  const available = await availableGeminiTextModels(gemini.key);
  const wanted = mode === "manual"
    ? normalizeGeminiTextModel(await getConfig("GEMINI_TEXT_MODEL"))
    : automaticTextModel(feature, budget);
  // Automatic mode starts on a stable model; preview/experimental ids have tight quotas.
  const stableWanted = mode === "manual" ? wanted : (STABLE_TEXT_CHAIN.find((id) => !available.length || available.includes(id)) ?? wanted);
  const modelId = pickAvailable(stableWanted, available.filter((id) => mode === "manual" || !UNSTABLE.test(id)));
  const info: AiProviderInfo = { provider: "gemini", modelId, keySource: gemini.source };
  logAi("request", { feature, mode, budget, ...info });
  const provider = createOpenAICompatible({
    name: "google",
    baseURL: GEMINI_OPENAI_URL,
    supportsStructuredOutputs: structuredOutputs,
    headers: { Authorization: `Bearer ${gemini.key}` },
  });
  return { model: withBusyFallback(provider, modelId, available), info };
}

/** Ask Google which text models this key can use right now (cached 10 min). */
let modelCache: { key: string; at: number; ids: string[] } | null = null;
export async function availableGeminiTextModels(key: string): Promise<string[]> {
  if (modelCache && modelCache.key === key && Date.now() - modelCache.at < 600_000) return modelCache.ids;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}`);
    const body = (await res.json()) as any;
    const ids: string[] = (body.models ?? [])
      .filter((m: any) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
      .map((m: any) => String(m.name).replace(/^models\//, ""))
      .filter((id: string) => id.startsWith("gemini-") && !/image|tts|audio|live|embedding|robotics|computer|native/i.test(id));
    const ver = (id: string) => parseFloat(id.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? "0");
    ids.sort((a, b) => ver(b) - ver(a) || Number(/preview|exp/.test(a)) - Number(/preview|exp/.test(b)));
    if (ids.length) modelCache = { key, at: Date.now(), ids };
    return ids;
  } catch {
    return [];
  }
}

function tierOf(id: string) {
  return /lite/.test(id) ? "lite" : /pro/.test(id) ? "pro" : "flash";
}

/** Keep the wanted model if Google still offers it; otherwise use the newest model of the same tier. */
export function pickAvailable(wanted: string, available: string[]): string {
  if (!available.length || available.includes(wanted)) return wanted;
  const t = tierOf(wanted);
  return available.find((id) => tierOf(id) === t) ?? available.find((id) => tierOf(id) === "flash") ?? available[0];
}

/** Stable models tried in order when the chosen one is busy, rate-limited or gone. */
export const STABLE_TEXT_CHAIN = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-3.8-flash"];
const UNSTABLE = /^gemini-4|preview|exp|transcribe|customtools|omni|nano|banana/i;
function isBusy(err: unknown) {
  const status = (err as any)?.statusCode ?? (err as any)?.status;
  const text = String((err as any)?.message ?? err);
  return status === 503 || status === 429 || status === 500 || status === 404 || /no longer available|not found|too many requests|quota/i.test(text) || /unavailable|overloaded|high demand|resource.?exhausted|timed? ?out|fetch failed/i.test(text);
}
/** Builds the silent fallback order: chosen model, then stable models this key can use. */
export function fallbackChain(primary: string, available: string[] = []): string[] {
  const ok = (id: string) => !available.length || available.includes(id);
  const chain = [primary, ...STABLE_TEXT_CHAIN.filter(ok)];
  return [...new Set(chain)].slice(0, 6);
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function withBusyFallback(provider: (id: string) => any, primary: string, available: string[] = []) {
  const chain = fallbackChain(primary, available);
  const base = provider(primary);
  const attempt = async (method: "doGenerate" | "doStream", options: any) => {
    let last: unknown;
    for (let i = 0; i < chain.length; i++) {
      const id = chain[i];
      try {
        return await provider(id)[method](options);
      } catch (err) {
        last = err;
        if (!isBusy(err) || options?.abortSignal?.aborted) throw err;
        logAi("busy-fallback", { from: id, next: chain[i + 1] ?? null, status: (err as any)?.statusCode ?? null });
        // Short, growing pause with jitter so we never burst Google's per-minute limit.
        if (i < chain.length - 1) await sleep(Math.min(600 * 2 ** i, 4000) + Math.random() * 300);
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
  const claude = (await getConfig("AI_TEXT_PROVIDER"))?.trim().toLowerCase() === "claude";
  return {
    text_provider: claude ? "claude" : "gemini",
    text_model: claude ? ((await getConfig("CLAUDE_TEXT_MODEL"))?.trim() || "claude-sonnet-4-5") : normalizeGeminiTextModel(await getConfig("GEMINI_TEXT_MODEL")),
    image_provider: "magic_hour",
    image_model: "ai-photo-generator",
    gemini_key_present: Boolean(gemini),
    gemini_key_source: gemini?.source ?? null,
  };
}

function pxSize(aspect: string): { width: number; height: number } {
  if (aspect === "9:16") return { width: 832, height: 1248 };
  if (aspect === "4:5") return { width: 896, height: 1120 };
  if (aspect === "1:1") return { width: 1024, height: 1024 };
  return { width: 1344, height: 768 };
}

function fail(name: string, status: number, body: any): never {
  const msg = body?.detail?.[0]?.msg ?? body?.detail ?? body?.error?.message ?? body?.errors?.[0]?.message ?? body?.message ?? body?.error ?? `${name} returned ${status}`;
  throw Object.assign(new Error(typeof msg === "string" ? msg : JSON.stringify(msg).slice(0, 200)), { status });
}

async function toBase64(url: string) {
  const file = await fetch(url);
  if (!file.ok) throw new Error("Could not download the generated image.");
  return { base64: Buffer.from(await file.arrayBuffer()).toString("base64"), mime: (file.headers.get("Content-Type") ?? "image/jpeg").split(";")[0] };
}

async function generateWithFal(key: string, prompt: string, aspect: string) {
  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt.slice(0, 2000), image_size: pxSize(aspect), num_inference_steps: 4, num_images: 1, enable_safety_checker: true }),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || !body.images?.[0]?.url) fail("Fal.ai", res.status, body);
  return toBase64(body.images[0].url);
}

async function generateWithTogether(key: string, prompt: string, aspect: string) {
  const { width, height } = pxSize(aspect);
  const res = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "black-forest-labs/FLUX.1-schnell", prompt: prompt.slice(0, 2000), width, height, steps: 4, n: 1, response_format: "b64_json" }),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  const b64 = body.data?.[0]?.b64_json;
  if (res.ok && b64) return { base64: b64 as string, mime: "image/jpeg" };
  if (res.ok && body.data?.[0]?.url) return toBase64(body.data[0].url);
  fail("Together AI", res.status, body);
}

async function generateWithCloudflare(token: string, accountId: string, prompt: string) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt.slice(0, 2000), steps: 6 }),
  });
  const body = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || !body.result?.image) fail("Cloudflare", res.status, body);
  return { base64: body.result.image as string, mime: "image/jpeg" };
}

async function generateWithMagicHour(key: string, prompt: string, aspect: string) {
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
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
  return { base64: Buffer.from(await file.arrayBuffer()).toString("base64"), mime };
}

/** Site photography: Magic Hour → Fal.ai → Together AI → Cloudflare. Any failure moves to the next connected provider. */
export async function generateImageBase64(
  prompt: string,
  opts?: { feature?: string; requestedModel?: string; requestedProvider?: AiProviderKey; requestedBy?: string; aspectRatio?: string },
): Promise<{ base64: string; mime: string; provider: AiProviderKey; modelId: string; fallback: boolean }> {
  const { getConfig } = await import("../settings.server");
  const [mh, fal, tg, cfTok, cfAcc] = await Promise.all([
    getConfig("MAGIC_HOUR_API_KEY"), getConfig("FAL_API_KEY"), getConfig("TOGETHER_API_KEY"),
    getConfig("CLOUDFLARE_API_TOKEN"), getConfig("CLOUDFLARE_ACCOUNT_ID"),
  ]);
  const feature = opts?.feature ?? "image";
  const aspect = opts?.aspectRatio ?? (/2:3|vertical|Pinterest/i.test(prompt) ? "9:16" : /4:5/.test(prompt) ? "4:5" : "16:9");
  const chain: { provider: AiProviderKey; name: string; model: string; run: () => Promise<{ base64: string; mime: string }> }[] = [];
  if (mh) chain.push({ provider: "magic_hour", name: "Magic Hour", model: "ai-photo-generator", run: () => generateWithMagicHour(mh, prompt, aspect) });
  if (fal) chain.push({ provider: "fal", name: "Fal.ai", model: "flux-schnell", run: () => generateWithFal(fal, prompt, aspect) });
  if (tg) chain.push({ provider: "together", name: "Together AI", model: "FLUX.1-schnell", run: () => generateWithTogether(tg, prompt, aspect) });
  if (cfTok && cfAcc) chain.push({ provider: "cloudflare", name: "Cloudflare", model: "flux-1-schnell", run: () => generateWithCloudflare(cfTok, cfAcc, prompt) });
  if (!chain.length) throw new Error("Connect an image provider (Magic Hour, Fal.ai, Together AI or Cloudflare) in Connections to generate photos.");
  const errors: string[] = [];
  for (let i = 0; i < chain.length; i++) {
    const p = chain[i];
    try {
      const out = await p.run();
      await recordAiUsage({ feature, operation: "generate", provider: p.provider, modelId: p.model, outcome: i ? "fallback" : "success", requestedBy: opts?.requestedBy });
      return { ...out, provider: p.provider, modelId: p.model, fallback: i > 0 };
    } catch (err) {
      const status = (err as any)?.status;
      const msg = String((err as Error)?.message ?? err);
      await recordAiUsage({ feature, operation: "generate", provider: p.provider, modelId: p.model, outcome: "failed", statusCode: status, errorMessage: msg.slice(0, 300), requestedBy: opts?.requestedBy });
      errors.push(status === 402 ? `${p.name}: out of credits` : `${p.name}: ${msg}`);
    }
  }
  throw new Error(`Image failed. ${errors.join(" · ")}`);
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
