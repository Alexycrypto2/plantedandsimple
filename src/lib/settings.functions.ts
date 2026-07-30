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
  { key: "GEMINI_API_KEY", label: "Gemini API key", hint: "Optional — leave empty to use built-in Lovable AI images" },
  { key: "GEMINI_IMAGE_MODEL", label: "Gemini image model", hint: "Default: gemini-2.5-flash-image" },
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