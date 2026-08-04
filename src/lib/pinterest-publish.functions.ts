import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireBoss(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!(data ?? []).some((r: any) => r.role === "boss")) throw new Error("Forbidden");
}

export type PublishablePin = {
  id: string;
  title: string;
  topic: string | null;
  status: string;
  image_url: string | null;
  style: string | null;
  description: string | null;
  target_path: string;
  target_label: string;
  posted: boolean;
};

export const listPublishablePins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PublishablePin[]> => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolvePinTarget } = await import("./pinterest-publish.server");
    const { data } = await (supabaseAdmin as any)
      .from("ai_generations")
      .select("id,title,topic,status,preview_url,payload,created_at")
      .eq("kind", "pinterest_pin")
      .in("status", ["approved", "published"])
      .order("created_at", { ascending: false })
      .limit(40);
    const { data: posts } = await (supabaseAdmin as any)
      .from("pinterest_posts")
      .select("generation_id");
    const posted = new Set((posts ?? []).map((p: any) => p.generation_id));

    const out: PublishablePin[] = [];
    for (const g of data ?? []) {
      const target = await resolvePinTarget(g.payload ?? {});
      out.push({
        id: g.id,
        title: g.title,
        topic: g.topic,
        status: g.status,
        image_url: g.payload?.image_url ?? g.preview_url ?? null,
        style: g.payload?.style ?? null,
        description: g.payload?.description ?? null,
        target_path: target.path,
        target_label: target.label,
        posted: posted.has(g.id),
      });
    }
    return out;
  });

export const listPinPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("pinterest_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

/** One click: create the tracked post and push it to Pinterest right away. */
export const publishPinNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { generationId: string; boardId: string; boardName?: string | null }) => ({
    generationId: String(d.generationId),
    boardId: String(d.boardId),
    boardName: d.boardName ? String(d.boardName).slice(0, 120) : null,
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { ensurePinPost, publishPinPost, trackingUrl } = await import("./pinterest-publish.server");
    const post = await ensurePinPost({
      generationId: data.generationId,
      userId: context.userId,
      boardId: data.boardId,
      boardName: data.boardName,
    });
    const published = await publishPinPost(post.id);
    return { ok: true, post: published, tracking_url: trackingUrl(post.slug) };
  });

/** One click: schedule the pin for later; the cron endpoint publishes it. */
export const schedulePinPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { generationId: string; boardId: string; boardName?: string | null; scheduledFor: string }) => ({
    generationId: String(d.generationId),
    boardId: String(d.boardId),
    boardName: d.boardName ? String(d.boardName).slice(0, 120) : null,
    scheduledFor: String(d.scheduledFor),
  }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { ensurePinPost, trackingUrl } = await import("./pinterest-publish.server");
    const post = await ensurePinPost({
      generationId: data.generationId,
      userId: context.userId,
      boardId: data.boardId,
      boardName: data.boardName,
      scheduledFor: data.scheduledFor,
    });
    return { ok: true, post, tracking_url: trackingUrl(post.slug) };
  });

export const retryPinPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { publishPinPost } = await import("./pinterest-publish.server");
    return { ok: true, post: await publishPinPost(data.id) };
  });

export const cancelPinPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data, context }) => {
    await requireBoss(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("pinterest_posts")
      .update({ status: "canceled" })
      .eq("id", data.id)
      .neq("status", "published");
    return { ok: true };
  });