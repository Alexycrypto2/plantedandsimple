import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SettingRow = {
  key: string;
  label: string;
  hint: string;
  masked: string | null;
  source: "panel" | "secret" | "missing";
};

const FIELDS: { key: string; label: string; hint: string }[] = [
  { key: "PINTEREST_CLIENT_ID", label: "Pinterest App ID", hint: "From your Pinterest developer app" },
  { key: "PINTEREST_CLIENT_SECRET", label: "Pinterest App Secret", hint: "Keep this private" },
  { key: "GEMINI_API_KEY", label: "Gemini API key", hint: "Required — every AI feature connects directly to Google Gemini" },
  { key: "GEMINI_IMAGE_MODEL", label: "Gemini image model", hint: "Default: gemini-2.5-flash-image" },
  { key: "GEMINI_TEXT_MODEL", label: "Gemini text model", hint: "Default: gemini-2.5-flash — powers blogs, recipes, pins, assistant" },
  { key: "AI_MODE", label: "AI model selection", hint: "Automatic chooses a suitable model for each task; Manual uses your selected models" },
  { key: "AI_BUDGET_MODE", label: "AI budget mode", hint: "Economy, Balanced, Quality, or Automatic" },
  {
    key: "PINTEREST_REDIRECT_URI",
    label: "Pinterest redirect URI",
    hint: "Use exactly: https://primedownloads.store/api/public/pinterest/oauth/callback",
  },
  {
    key: "PINTEREST_REGISTERED_REDIRECT_URI",
    label: "Callback saved in Pinterest",
    hint: "Paste the Redirect URI shown in your Pinterest developer app; the checker compares it character for character",
  },
];

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!(data ?? []).some((r: any) => r.role === "boss")) throw new Error("Forbidden");
}

export const adminListSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SettingRow[]> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { decrypt } = await import("./crypto.server");
    const { maskValue } = await import("./settings.server");
    const { data } = await (supabaseAdmin as any).from("app_settings").select("key, value_ciphertext");
    const rows = new Map<string, string>();
    for (const r of data ?? []) {
      try {
        rows.set(r.key, decrypt(r.value_ciphertext));
      } catch {
        /* ignore bad ciphertext */
      }
    }
    return FIELDS.map((f) => {
      const panel = rows.get(f.key);
      const env = process.env[f.key];
      const value = panel ?? env ?? null;
      return {
        ...f,
        masked: maskValue(value),
        source: panel ? "panel" : env ? "secret" : "missing",
      } as SettingRow;
    });
  });

export const adminSaveSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: string }) => ({
    key: String(d.key),
    value: String(d.value ?? "").trim().slice(0, 4000),
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    if (!FIELDS.some((f) => f.key === data.key)) throw new Error("Unknown setting");
    const { setConfig } = await import("./settings.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!data.value) {
      await (supabaseAdmin as any).from("app_settings").delete().eq("key", data.key);
      return { ok: true, cleared: true };
    }
    await setConfig(data.key as any, data.value);
    return { ok: true, cleared: false };
  });

/** Live provider audit — runs one real text + one real image request and reports the raw outcome. */
export const aiDiagnostics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireBoss(context.supabase, context.userId);
    const { aiProviderSnapshot, resolveTextModel, generateImageBase64 } = await import("./ai/gateway.server");
    const snapshot = await aiProviderSnapshot();

    let text: { ok: boolean; detail: string } = { ok: false, detail: "" };
    try {
      const { streamText } = await import("ai");
      const { model } = await resolveTextModel({ structuredOutputs: false, feature: "diagnostics" });
      const res = streamText({ model, prompt: "Reply with the single word: ready", maxRetries: 0 });
      text = { ok: true, detail: ((await res.text) || "").slice(0, 80) };
    } catch (e: any) {
      text = { ok: false, detail: String(e?.message ?? e).slice(0, 500) };
    }

    let image: { ok: boolean; detail: string } = { ok: false, detail: "" };
    try {
      const img = await generateImageBase64("A single ripe avocado on a cream linen surface, soft daylight.");
      image = {
        ok: true,
        detail: `${img.mime}, ${Math.round(img.base64.length / 1366)}KB · ${img.provider ?? snapshot.image_provider} · ${img.modelId ?? snapshot.image_model}`,
      };
    } catch (e: any) {
      image = { ok: false, detail: String(e?.message ?? e).slice(0, 500) };
    }

    return { ...snapshot, text, image };
  });

export const listGeminiModels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireBoss(context.supabase, context.userId);
    const { resolveGeminiKey } = await import("./ai/gateway.server");
    const gemini = await resolveGeminiKey();
    if (!gemini) throw new Error("Save a Gemini API key first.");
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
      headers: { "x-goog-api-key": gemini.key },
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`Gemini model catalog ${res.status}: ${body.slice(0, 400)}`);
    const data = JSON.parse(body) as { models?: Array<{ name?: string; displayName?: string; supportedGenerationMethods?: string[] }> };
    return (data.models ?? [])
      .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
      .map((model) => ({
        id: String(model.name ?? "").replace(/^models\//, ""),
        name: model.displayName ?? model.name ?? "Gemini model",
        image: /image/i.test(`${model.name} ${model.displayName}`),
      }))
      .filter((model) => model.id.startsWith("gemini-"))
      .sort((a, b) => a.id.localeCompare(b.id));
  });

export const aiModelManager = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireBoss(context.supabase, context.userId);
    const { getConfig } = await import("./settings.server");
    const { aiRecommendationSummary } = await import("./ai/gateway.server");
    return aiRecommendationSummary({
      mode: await getConfig("AI_MODE"),
      budget: await getConfig("AI_BUDGET_MODE"),
    });
  });