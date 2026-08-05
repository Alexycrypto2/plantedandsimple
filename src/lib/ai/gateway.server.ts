import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
export const DEFAULT_CHAT_MODEL = "openai/gpt-5.6-sol";
export const DEFAULT_IMAGE_MODEL = "google/gemini-3.1-flash-image";
export const GEMINI_OPENAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
export const DEFAULT_GEMINI_TEXT_MODEL = "gemini-2.5-flash";

export type AiProviderName = "gemini" | "lovable";

export type AiProviderInfo = {
  provider: AiProviderName;
  modelId: string;
  keySource: "admin_settings" | "environment" | "lovable_managed";
};

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

export function requireApiKey(): string {
  const k = process.env.LOVABLE_API_KEY;
  if (!k) throw new Error("LOVABLE_API_KEY is not set");
  return k;
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
      `Lovable AI credits are exhausted (402) and no Gemini key was used. Add a valid Gemini API key in Settings → Integrations so requests go to Google directly. [${where}]`,
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
 * Gemini (admin key) is preferred; Lovable AI Gateway is the fallback.
 */
export async function resolveTextModel(opts?: { structuredOutputs?: boolean; feature?: string }) {
  const structuredOutputs = opts?.structuredOutputs ?? true;
  const gemini = await resolveGeminiKey();

  if (gemini) {
    const { getConfig } = await import("../settings.server");
    const modelId = (await getConfig("GEMINI_TEXT_MODEL")) || DEFAULT_GEMINI_TEXT_MODEL;
    const info: AiProviderInfo = { provider: "gemini", modelId, keySource: gemini.source };
    logAi("request", { feature: opts?.feature ?? "unknown", ...info });
    const provider = createOpenAICompatible({
      name: "lovable", // keep the providerOptions key stable across providers
      baseURL: GEMINI_OPENAI_URL,
      supportsStructuredOutputs: structuredOutputs,
      headers: { Authorization: `Bearer ${gemini.key}` },
    });
    return { model: provider(modelId), info };
  }

  const info: AiProviderInfo = {
    provider: "lovable",
    modelId: DEFAULT_CHAT_MODEL,
    keySource: "lovable_managed",
  };
  logAi("request", { feature: opts?.feature ?? "unknown", ...info, note: "no Gemini key configured" });
  return { model: createGateway({ structuredOutputs })(DEFAULT_CHAT_MODEL), info };
}

/** Convenience: returns just the model, used by every AI feature. */
export async function textModel(feature?: string, structuredOutputs = true) {
  const { model } = await resolveTextModel({ structuredOutputs, feature });
  return model;
}

/** Runs an AI call with provider logging and real, actionable error messages. */
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

/** Read-only snapshot for the admin diagnostics panel. */
export async function aiProviderSnapshot() {
  const gemini = await resolveGeminiKey();
  const { getConfig } = await import("../settings.server");
  return {
    text_provider: gemini ? "gemini" : "lovable",
    text_model: gemini
      ? (await getConfig("GEMINI_TEXT_MODEL")) || DEFAULT_GEMINI_TEXT_MODEL
      : DEFAULT_CHAT_MODEL,
    image_provider: gemini ? "gemini" : "lovable",
    image_model: gemini
      ? (await getConfig("GEMINI_IMAGE_MODEL")) || "gemini-2.5-flash-image"
      : DEFAULT_IMAGE_MODEL,
    gemini_key_present: Boolean(gemini),
    gemini_key_source: gemini?.source ?? null,
    lovable_key_present: Boolean(process.env.LOVABLE_API_KEY),
  };
}

export function createGateway(opts?: { structuredOutputs?: boolean }) {
  const key = requireApiKey();
  return createOpenAICompatible({
    name: "lovable",
    baseURL: AI_GATEWAY_URL,
    supportsStructuredOutputs: opts?.structuredOutputs ?? true,
    headers: {
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

/** Raw gateway image call — Gemini image via chat completions with image modality. */
export async function generateImageBase64(prompt: string, model = DEFAULT_IMAGE_MODEL): Promise<{ base64: string; mime: string }> {
  // If the boss configured their own Gemini API key in admin settings, use it directly.
  const { getConfig } = await import("../settings.server");
  const gemini = await resolveGeminiKey();
  if (gemini) {
    const geminiKey = gemini.key;
    const geminiModel = (await getConfig("GEMINI_IMAGE_MODEL")) || "gemini-2.5-flash-image";
    logAi("image-request", { provider: "gemini", modelId: geminiModel, keySource: gemini.source });
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    const text = await res.text();
    if (!res.ok) {
      logAi("image-error", { provider: "gemini", modelId: geminiModel, status: res.status, body: text.slice(0, 600) });
      throw new Error(`Gemini image ${res.status} (${geminiModel}): ${text.slice(0, 500)}`);
    }
    const json: any = JSON.parse(text);
    const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
    const inline = parts.find((p) => p?.inlineData?.data)?.inlineData;
    if (!inline) throw new Error("Gemini returned no image data");
    return { base64: inline.data, mime: inline.mimeType || "image/png" };
  }

  const key = requireApiKey();
  logAi("image-request", { provider: "lovable", modelId: model, keySource: "lovable_managed" });
  const res = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "primedownloads",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    logAi("image-error", { provider: "lovable", modelId: model, status: res.status, body: text.slice(0, 600) });
    throw describeAiError(
      Object.assign(new Error(text.slice(0, 400)), { statusCode: res.status, responseBody: text }),
      { provider: "lovable", modelId: model, keySource: "lovable_managed" },
    );
  }
  const data: any = await res.json();
  const msg = data?.choices?.[0]?.message;
  const images: any[] = msg?.images ?? [];
  const first = images[0];
  const url: string | undefined = first?.image_url?.url ?? first?.url;
  if (!url || !url.startsWith("data:")) {
    throw new Error("Image gateway returned no image data");
  }
  const match = /^data:([^;]+);base64,(.+)$/.exec(url);
  if (!match) throw new Error("Unexpected image data URL");
  return { mime: match[1], base64: match[2] };
}