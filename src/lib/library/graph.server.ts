/**
 * Connected content graph.
 *
 * Whenever a library item (recipe, blog, product) is edited we fan the change
 * out across everything connected to it so the platform behaves like one brain:
 *  - bidirectional relations stay symmetrical and de-duplicated
 *  - linked items are touched so their pages/caches rebuild with fresh copy
 *  - campaign inputs (Pinterest pins, scheduled content) inherit the new copy
 *  - an analytics event + learning signal is written so dashboards and the AI
 *    recommendation engine see the edit in real time
 */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

const TABLE: Record<string, string> = { recipe: "recipes", blog: "blog_posts", product: "products" };
const TITLE: Record<string, string> = { recipe: "title", blog: "title", product: "title" };

export type GraphSyncResult = {
  linked: number;
  touched: number;
  campaigns_updated: number;
};

/** Every item connected to (type,id) in either direction. */
export async function linkedItems(type: string, id: string) {
  const db = await admin();
  const [out, inc] = await Promise.all([
    db.from("content_relations").select("to_type, to_id").eq("from_type", type).eq("from_id", id),
    db.from("content_relations").select("from_type, from_id").eq("to_type", type).eq("to_id", id),
  ]);
  const set = new Map<string, { type: string; id: string }>();
  for (const r of out.data ?? []) set.set(`${r.to_type}:${r.to_id}`, { type: r.to_type, id: r.to_id });
  for (const r of inc.data ?? []) set.set(`${r.from_type}:${r.from_id}`, { type: r.from_type, id: r.from_id });
  return [...set.values()];
}

/** Mirror every relation so both sides of the graph agree. */
export async function normaliseRelations(type: string, id: string) {
  const db = await admin();
  const { data } = await db
    .from("content_relations")
    .select("to_type, to_id, relation, sort_order")
    .eq("from_type", type)
    .eq("from_id", id);
  const rows = (data ?? []).map((r: any) => ({
    from_type: r.to_type,
    from_id: r.to_id,
    to_type: type,
    to_id: id,
    relation: r.relation ?? "related",
    sort_order: r.sort_order ?? 0,
  }));
  if (rows.length) {
    await db
      .from("content_relations")
      .upsert(rows, { onConflict: "from_type,from_id,to_type,to_id,relation", ignoreDuplicates: true });
  }
  return rows.length;
}

/**
 * Push an edit through the graph.
 * `entityType` is one of recipe | blog | product.
 */
export async function syncContentGraph(entityType: string, entityId: string): Promise<GraphSyncResult> {
  const db = await admin();
  const table = TABLE[entityType];
  if (!table) return { linked: 0, touched: 0, campaigns_updated: 0 };

  const { data: row } = await db.from(table).select("*").eq("id", entityId).maybeSingle();
  if (!row) return { linked: 0, touched: 0, campaigns_updated: 0 };

  const linked = await normaliseRelations(entityType, entityId);
  const neighbours = await linkedItems(entityType, entityId);

  // Touch every linked item so its rendered page, internal links and search
  // index pick up the new copy on next read.
  let touched = 0;
  const stamp = new Date().toISOString();
  for (const n of neighbours) {
    const t = TABLE[n.type];
    if (!t) continue;
    const { error } = await db.from(t).update({ updated_at: stamp }).eq("id", n.id);
    if (!error) touched += 1;
  }

  // Campaign inputs: pins and scheduled slots reuse the item's live copy.
  let campaigns = 0;
  const title = row[TITLE[entityType] ?? "title"] ?? "";
  const pinDescription = row.pinterest_description ?? row.seo_description ?? row.description ?? null;
  const { data: pins } = await db
    .from("pinterest_pins")
    .select("id, status")
    .eq("generation_id", entityId);
  for (const pin of pins ?? []) {
    if (pin.status === "published") continue;
    await db.from("pinterest_pins").update({ title, description: pinDescription }).eq("id", pin.id);
    campaigns += 1;
  }
  const { data: sched } = await db
    .from("content_schedule")
    .select("id, status")
    .eq("ref_id", entityId);
  for (const s of sched ?? []) {
    if (s.status === "published") continue;
    await db.from("content_schedule").update({ title }).eq("id", s.id);
    campaigns += 1;
  }

  // Analytics + learning: the edit itself is a signal.
  await db.from("analytics_events").insert({
    kind: "content_updated",
    ref_id: entityId,
    ref_slug: row.slug ?? null,
    metadata: { entity: entityType, status: row.status ?? null, linked: neighbours.length },
  });
  await db.from("learning_signals").insert({
    source: "platform:cms",
    entity_type: entityType,
    entity_id: entityId,
    entity_ref: row.slug ?? null,
    metric: "content_updated",
    value: 1,
    dimensions: {
      status: row.status ?? "draft",
      linked_items: neighbours.length,
      tags: row.tags ?? [],
    },
    occurred_at: stamp,
  });

  return { linked, touched, campaigns_updated: campaigns };
}
