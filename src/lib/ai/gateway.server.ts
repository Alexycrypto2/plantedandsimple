import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const GEMINI_OPENAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
export const DEFAULT_GEMINI_TEXT_MODEL = "gemini-2.5-flash";
export const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
export const DEFAULT_CHAT_MODEL = DEFAULT_GEMINI_TEXT_MODEL;
export const DEFAULT_IMAGE_MODEL = DEFAULT_GEMINI_IMAGE_MODEL;

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
  const modelId = normalizeGeminiTextModel(await getConfig("GEMINI_TEXT_MODEL"));
  const info: AiProviderInfo = { provider: "gemini", modelId, keySource: gemini.source };
  logAi("request", { feature: opts?.feature ?? "unknown", ...info });
  const provider = createOpenAICompatible({
    name: "google",
    baseURL: GEMINI_OPENAI_URL,
    supportsStructuredOutputs: structuredOutputs,
    headers: { Authorization: `Bearer ${gemini.key}` },
  });
  return { model: provider(modelId), info };
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
    image_provider: "gemini",
    image_model: normalizeGeminiImageModel(await getConfig("GEMINI_IMAGE_MODEL")),
    gemini_key_present: Boolean(gemini),
    gemini_key_source: gemini?.source ?? null,
  };
}

/** Raw gateway image call — Gemini image via chat completions with image modality. */
export async function generateImageBase64(
  prompt: string,
): Promise<{ base64: string; mime: string; provider: string; modelId: string }> {
  const { getConfig } = await import("../settings.server");
  const gemini = await resolveGeminiKey();
  if (!gemini) throw new Error("Gemini API key is missing. Add it in Admin → Settings → Integrations.");
  {
    const geminiKey = gemini.key;
    const geminiModel = normalizeGeminiImageModel(await getConfig("GEMINI_IMAGE_MODEL"));
    logAi("image-request", { provider: "gemini", modelId: geminiModel, keySource: gemini.source });
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    
    if (res.ok) {
      const text = await res.text();
      const json: any = JSON.parse(text);
      const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
      const inline = parts.find((p) => p?.inlineData?.data)?.inlineData;
      if (inline) {
        return { base64: inline.data, mime: inline.mimeType || "image/png", provider: "gemini", modelId: geminiModel };
      }
    } else {
      const text = await res.text();
      logAi("image-error", { provider: "gemini", modelId: geminiModel, status: res.status, body: text.slice(0, 600) });
      const reason = res.status === 429 ? "Quota exhausted or rate limited" : "Request failed";
      throw new Error(`Gemini image ${res.status} · ${geminiModel} · ${reason}: ${text.slice(0, 500)}`);
    }
  }
  throw new Error("Gemini returned no image data. Confirm the selected model supports image generation.");
}
