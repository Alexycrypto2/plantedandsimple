import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GenerationKind = "blog" | "image" | "pinterest_pin" | "email" | "product_desc" | "product_promo" | "social" | "campaign";
export type GenerationStatus = "pending" | "approved" | "rejected" | "published";

export type Generation = {
  id: string;
  kind: GenerationKind;
  title: string;
  topic: string | null;
  payload: any;
  preview_url: string | null;
  model: string | null;
  seo_score: number | null;
  quality_score: number | null;
  status: GenerationStatus;
  created_at: string;
  decided_at: string | null;
  scheduled_for: string | null;
  notes: string | null;
  published_ref_id: string | null;
};

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!((data ?? []).some((r: any) => r.role === "boss"))) throw new Error("Forbidden");
}

export const listGenerations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind?: GenerationKind | "all"; status?: GenerationStatus | "all" }) => d)
  .handler(async ({ data, context }): Promise<Generation[]> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = (supabaseAdmin as any).from("ai_generations").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.kind && data.kind !== "all") q = q.eq("kind", data.kind);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as Generation[];
  });

export const setGenerationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: GenerationStatus; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("ai_generations").update({
      status: data.status,
      decided_at: new Date().toISOString(),
      notes: data.notes ?? null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("ai_generations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkAct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids: string[]; action: "approve" | "reject" | "delete" }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "delete") {
      const { error } = await (supabaseAdmin as any).from("ai_generations").delete().in("id", data.ids);
      if (error) throw new Error(error.message);
    } else {
      const status = data.action === "approve" ? "approved" : "rejected";
      const { error } = await (supabaseAdmin as any).from("ai_generations").update({
        status, decided_at: new Date().toISOString(),
      }).in("id", data.ids);
      if (error) throw new Error(error.message);
    }
    return { ok: true, count: data.ids.length };
  });

export const approveCampaignAssets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { data: campaign, error } = await db
      .from("ai_generations")
      .select("id,kind,payload")
      .eq("id", data.id)
      .single();
    if (error || campaign?.kind !== "campaign") throw new Error("Campaign not found");

    const payload = campaign.payload ?? {};
    const generationIds = [
      payload.blog?.id,
      payload.promo?.id,
      ...(Array.isArray(payload.pins) ? payload.pins.map((pin: any) => pin?.id) : []),
    ].filter((id): id is string => typeof id === "string" && id.length > 0);
    const decidedAt = new Date().toISOString();
    if (generationIds.length) {
      const { error: assetError } = await db
        .from("ai_generations")
        .update({ status: "approved", decided_at: decidedAt })
        .in("id", generationIds);
      if (assetError) throw new Error(assetError.message);
    }
    if (payload.email?.id) {
      const { error: emailError } = await db
        .from("email_campaigns")
        .update({ status: "approved" })
        .eq("id", payload.email.id);
      if (emailError) throw new Error(emailError.message);
    }
    const { error: campaignError } = await db
      .from("ai_generations")
      .update({ status: "approved", decided_at: decidedAt })
      .eq("id", campaign.id);
    if (campaignError) throw new Error(campaignError.message);
    return { ok: true, count: generationIds.length + (payload.email?.id ? 1 : 0) };
  });

export const publishBlogGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; asStatus?: "draft" | "published" }) => d)
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: gen, error } = await (supabaseAdmin as any).from("ai_generations").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    if (gen.kind !== "blog") throw new Error("Not a blog generation");
    if (gen.status !== "approved") throw new Error("Approve the generation first");
    const p = gen.payload ?? {};
    const payload = {
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? null,
      content: p.content ?? "",
      featured_image_url: p.featured_image_url ?? null,
      category: p.category ?? null,
      tags: p.tags ?? [],
      seo_title: p.seo_title ?? null,
      seo_description: p.seo_description ?? null,
      status: data.asStatus ?? "draft",
      author_id: context.userId,
      ...(data.asStatus === "published" ? { published_at: new Date().toISOString() } : {}),
    };
    const { data: row, error: upErr } = await (supabaseAdmin as any).from("blog_posts")
      .upsert(payload, { onConflict: "slug" }).select("id").single();
    if (upErr) throw new Error(upErr.message);
    await (supabaseAdmin as any).from("ai_generations").update({
      status: "published", published_ref_id: row.id, decided_at: new Date().toISOString(),
    }).eq("id", data.id);
    return { ok: true, post_id: row.id };
  });