import { decrypt, encrypt } from "./crypto.server";

export const SETTING_KEYS = [
  "PINTEREST_CLIENT_ID",
  "PINTEREST_CLIENT_SECRET",
  "PINTEREST_REDIRECT_URI",
  "GEMINI_API_KEY",
  "GEMINI_IMAGE_MODEL",
  "GEMINI_TEXT_MODEL",
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

/** Reads a config value: database (admin panel) first, then environment secret. */
export async function getConfig(key: SettingKey): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("app_settings")
      .select("value_ciphertext")
      .eq("key", key)
      .maybeSingle();
    if (data?.value_ciphertext) {
      const v = decrypt(data.value_ciphertext);
      if (v) return v;
    }
  } catch {
    // fall through to env
  }
  return process.env[key] ?? null;
}

export async function setConfig(key: SettingKey, value: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await (supabaseAdmin as any).from("app_settings").upsert(
    { key, value_ciphertext: encrypt(value), is_secret: true, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
}

export function maskValue(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 6) return "••••";
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}