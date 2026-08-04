import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireBossFactory } from "./studio.server";

const requireBoss = requireBossFactory();

/** One recipe → blog + 5 pins + email + product promo, all linked in the library graph. */
export const generateCampaignFromRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { recipeId: string; productSlug?: string | null }) => ({
    recipeId: String(d.recipeId),
    productSlug: d.productSlug ? String(d.productSlug).slice(0, 120) : null,
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { runCampaign } = await import("./campaign.server");
    return await runCampaign({ recipeId: data.recipeId, userId: context.userId, productSlug: data.productSlug });
  });

export const listCampaigns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("ai_generations")
      .select("id,title,topic,payload,preview_url,status,quality_score,created_at")
      .eq("kind", "campaign")
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });

export const listRecipeOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("recipes")
      .select("id,title,slug,status")
      .order("updated_at", { ascending: false })
      .limit(100);
    return (data ?? []) as Array<{ id: string; title: string; slug: string; status: string }>;
  });
