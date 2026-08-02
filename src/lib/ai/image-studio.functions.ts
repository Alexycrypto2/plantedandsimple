import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateImageBase64, DEFAULT_IMAGE_MODEL } from "./gateway.server";

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!((data ?? []).some((r: any) => r.role === "boss"))) throw new Error("Forbidden");
}

export type ImagePreset =
  | "blog_hero"
  | "pinterest_pin"
  | "instagram_square"
  | "facebook_image"
  | "cookbook_promo";

const BRAND = "warm natural window light, editorial food photography, cream and forest-green palette, matte linen backdrop, wooden serving board, fresh herbs, high resolution, sharp focus";

const PRESETS: Record<ImagePreset, { label: string; framing: string }> = {
  blog_hero: { label: "Blog hero (1200x630)", framing: "wide 1.9:1 landscape composition, safe-crop for social sharing, subject centered" },
  pinterest_pin: { label: "Pinterest pin (1000x1500)", framing: "vertical 2:3 pin composition, tall frame, room for text overlay at top and bottom, subject dead center" },
  instagram_square: { label: "Instagram square (1080x1080)", framing: "1:1 square composition, subject centered" },
  facebook_image: { label: "Facebook link (1200x630)", framing: "1.9:1 landscape, subject center-left" },
  cookbook_promo: { label: "Cookbook promo", framing: "flat-lay of a hardcover recipe book beside styled plant-based dishes, soft shadows, magazine cover feel" },
};

export const generateStudioImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { preset: ImagePreset; subject: string; title?: string }) => ({
    preset: d.preset,
    subject: String(d.subject || "").slice(0, 400),
    title: d.title ? String(d.title).slice(0, 160) : undefined,
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const preset = PRESETS[data.preset];
    if (!preset) throw new Error("Unknown preset");
    const { getMemoryContext } = await import("@/lib/learning/engine.server");
    const memory = await getMemoryContext("image");
    const prompt = `${data.subject}. ${preset.framing}. ${BRAND}. No text overlay, no watermark.\n\n${memory}`;

    const { base64, mime } = await generateImageBase64(prompt);
    const ext = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
    const path = `${data.preset}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const buffer = Buffer.from(base64, "base64");
    const { error: upErr } = await supabaseAdmin.storage.from("ai-images")
      .upload(path, buffer, { contentType: mime, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: signed } = await supabaseAdmin.storage.from("ai-images").createSignedUrl(path, 60 * 60 * 24 * 365);
    const preview_url = signed?.signedUrl ?? null;

    const { data: row, error } = await (supabaseAdmin as any).from("ai_generations").insert({
      kind: "image",
      title: data.title || `${preset.label} — ${data.subject.slice(0, 60)}`,
      topic: data.subject,
      payload: { preset: data.preset, prompt, storage_path: path, mime },
      preview_url,
      model: DEFAULT_IMAGE_MODEL,
      created_by: context.userId,
      status: "pending",
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id, preview_url };
  });

export const listPresets = createServerFn({ method: "GET" }).handler(async () => {
  return Object.entries(PRESETS).map(([k, v]) => ({ id: k, label: v.label }));
});