import { getAccessToken, pinterestFetch } from "./pinterest.server";

export const SITE_ORIGIN = "https://www.plantedandsimple.store";

function slugify(v: string) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function randomSlug() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export type PinTarget = { path: string; label: string };

/** Works out which page on the site a pin should send traffic to. */
export async function resolvePinTarget(payload: any): Promise<PinTarget> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (payload?.recipe_slug) return { path: `/recipes/${payload.recipe_slug}`, label: "Recipe" };
  if (payload?.source_recipe_id) {
    const { data } = await (supabaseAdmin as any)
      .from("recipes")
      .select("slug")
      .eq("id", payload.source_recipe_id)
      .maybeSingle();
    if (data?.slug) return { path: `/recipes/${data.slug}`, label: "Recipe" };
  }
  if (payload?.blog_slug) return { path: `/blog/${payload.blog_slug}`, label: "Article" };
  if (payload?.product_slug) return { path: `/shop/${payload.product_slug}`, label: "Product" };
  if (payload?.link) {
    try {
      const u = new URL(payload.link, SITE_ORIGIN);
      return { path: `${u.pathname}${u.search}`, label: "Custom link" };
    } catch {
      /* ignore malformed links */
    }
  }
  return { path: "/recipes", label: "Recipe library" };
}

/** Adds UTM tracking to the on-site destination the pin redirects to. */
export function withUtm(path: string, opts: { campaign: string; content: string; term?: string }) {
  const url = new URL(path, SITE_ORIGIN);
  url.searchParams.set("utm_source", "pinterest");
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", slugify(opts.campaign) || "pinterest");
  url.searchParams.set("utm_content", slugify(opts.content) || "pin");
  if (opts.term) url.searchParams.set("utm_term", slugify(opts.term));
  return url.toString();
}

export function trackingUrl(slug: string) {
  return `${SITE_ORIGIN}/p/${slug}`;
}

/** Creates the tracked post row for a pin generation. */
export async function ensurePinPost(opts: {
  generationId: string;
  userId: string;
  boardId?: string | null;
  boardName?: string | null;
  scheduledFor?: string | null;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: gen } = await (supabaseAdmin as any)
    .from("ai_generations")
    .select("id,title,topic,preview_url,payload,status")
    .eq("id", opts.generationId)
    .maybeSingle();
  if (!gen) throw new Error("Pin not found");
  if (gen.status === "rejected") throw new Error("This pin was rejected.");

  const payload = gen.payload ?? {};
  const target = await resolvePinTarget(payload);
  const slug = `${slugify(gen.title).slice(0, 28) || "pin"}-${randomSlug()}`;
  const destination = withUtm(target.path, {
    campaign: payload.campaign_slug || gen.topic || gen.title,
    content: payload.style || "pin",
    term: payload.primary_keyword,
  });

  const description = [payload.description, (payload.hashtags ?? []).join(" ")]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 800);

  const { data: row, error } = await (supabaseAdmin as any)
    .from("pinterest_posts")
    .insert({
      generation_id: gen.id,
      user_id: opts.userId,
      board_id: opts.boardId ?? null,
      board_name: opts.boardName ?? null,
      slug,
      destination_url: destination,
      target_path: target.path,
      title: String(gen.title).slice(0, 100),
      description,
      image_url: payload.image_url ?? gen.preview_url ?? null,
      scheduled_for: opts.scheduledFor ? new Date(opts.scheduledFor).toISOString() : null,
      status: opts.scheduledFor ? "scheduled" : "queued",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return row;
}

/** Pushes one stored post to the Pinterest API. */
export async function publishPinPost(postId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: post } = await (supabaseAdmin as any)
    .from("pinterest_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (!post) throw new Error("Post not found");
  if (post.status === "published") return post;

  const fail = async (message: string): Promise<never> => {
    await (supabaseAdmin as any)
      .from("pinterest_posts")
      .update({ status: "failed", error: message.slice(0, 500) })
      .eq("id", postId);
    throw new Error(message);
  };

  const token = await getAccessToken(post.user_id);
  if (!token) return await fail("Pinterest account is not connected.");
  if (!post.board_id) return await fail("Choose a Pinterest board first.");
  if (!post.image_url) return await fail("This pin has no image to publish.");

  try {
    const res = await pinterestFetch(token, "/pins", {
      method: "POST",
      body: JSON.stringify({
        board_id: post.board_id,
        title: post.title,
        description: post.description ?? undefined,
        alt_text: String(post.title ?? "").slice(0, 500),
        link: trackingUrl(post.slug),
        media_source: { source_type: "image_url", url: post.image_url },
      }),
    });
    const { data: updated } = await (supabaseAdmin as any)
      .from("pinterest_posts")
      .update({
        status: "published",
        pin_id: res?.id ?? null,
        published_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", postId)
      .select("*")
      .single();
    if (post.generation_id) {
      await (supabaseAdmin as any)
        .from("ai_generations")
        .update({ status: "published", published_ref_id: res?.id ?? null })
        .eq("id", post.generation_id);
    }
    return updated;
  } catch (e: any) {
    return await fail(String(e?.message ?? e));
  }
}

/** Publishes every scheduled pin whose time has come. Used by the cron endpoint. */
export async function publishDuePins(limit = 10) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: due } = await (supabaseAdmin as any)
    .from("pinterest_posts")
    .select("id")
    .in("status", ["scheduled", "queued"])
    .not("scheduled_for", "is", null)
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const row of due ?? []) {
    try {
      await publishPinPost(row.id);
      results.push({ id: row.id, ok: true });
    } catch (e: any) {
      results.push({ id: row.id, ok: false, error: String(e?.message ?? e) });
    }
  }
  return results;
}