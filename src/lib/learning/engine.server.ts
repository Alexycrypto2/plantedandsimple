/**
 * AI Memory & Continuous Learning Engine — core (server only).
 *
 * Everything the platform learns flows through one table (`learning_signals`),
 * so any future data source (Search Console, Pinterest Analytics, GA, email,
 * affiliates) plugs in by writing signals with the same shape — no rebuild.
 */

export type SignalInput = {
  source: string;
  metric: string;
  value: number;
  entity_type?: string;
  entity_id?: string | null;
  entity_ref?: string | null;
  dimensions?: Record<string, unknown>;
  occurred_at?: string;
};

/** Metric families, grouped by the story they tell. */
export const METRIC_FAMILIES: Record<string, string[]> = {
  pinterest: ["pinterest_saves", "pinterest_clicks", "pinterest_impressions", "outbound_clicks", "ctr"],
  content: ["blog_views", "recipe_views", "time_on_page", "search_position", "internal_link_clicks"],
  commerce: ["sales", "revenue", "downloads", "conversion_rate", "email_signups", "affiliate_clicks"],
  site: ["homepage_clicks", "section_clicks", "cta_clicks"],
};

/** The dimensions the AI reasons over. Add one here and it is learned automatically. */
export const LEARNED_DIMENSIONS = [
  "pin_style",
  "image_style",
  "blog_format",
  "headline_style",
  "cta_style",
  "category",
  "cluster",
  "publish_dow",
  "publish_hour",
  "season",
  "homepage_section",
  "link_strategy",
] as const;
export type LearnedDimension = (typeof LEARNED_DIMENSIONS)[number];

export function seasonOf(d: Date) {
  const m = d.getUTCMonth();
  if (m <= 1 || m === 11) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "autumn";
}

const DOW = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export async function recordSignals(signals: SignalInput[]) {
  if (!signals.length) return 0;
  const db = await admin();
  const rows = signals.map((s) => ({
    source: s.source,
    metric: s.metric,
    value: Number(s.value) || 0,
    entity_type: s.entity_type ?? "unknown",
    entity_id: s.entity_id ?? null,
    entity_ref: s.entity_ref ?? null,
    dimensions: s.dimensions ?? {},
    occurred_at: s.occurred_at ?? new Date().toISOString(),
  }));
  const { error } = await db.from("learning_signals").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}

const headlineStyle = (title: string) => {
  const t = String(title ?? "");
  if (/^\d+\s/.test(t)) return "numbered-listicle";
  if (/^how\s/i.test(t)) return "how-to";
  if (/\?$/.test(t)) return "question";
  if (/:/.test(t)) return "colon-subtitle";
  return "statement";
};

const blogFormat = (p: any) => {
  const t = String(p?.title ?? "");
  if (/^\d+\s/.test(t)) return "listicle";
  if (/guide|ultimate|complete/i.test(t)) return "guide";
  if (/recipe|how to make/i.test(t)) return "recipe-post";
  return "editorial";
};

/**
 * Turns everything already happening on the platform into signals:
 * page views, clicks, pins, blog posts and downloads.
 * Derived rows are rebuilt each run so they never double-count.
 */
export async function deriveSignalsFromPlatform(windowDays = 180) {
  const db = await admin();
  const since = new Date(Date.now() - windowDays * 864e5).toISOString();

  const [{ data: events }, { data: posts }, { data: pins }, { data: products }, { data: dl }] =
    await Promise.all([
      db.from("analytics_events").select("kind, ref_id, ref_slug, metadata, occurred_at").gte("occurred_at", since).limit(5000),
      db.from("blog_posts").select("id, slug, title, category, tags, published_at").limit(500),
      db.from("pinterest_pins").select("id, title, status, published_at, created_at").limit(500),
      db.from("products").select("id, slug, title, category_id").limit(200),
      db.from("cookbook_downloads").select("id, created_at, download_count").gte("created_at", since).limit(2000),
    ]);

  const postBySlug = new Map<string, any>((posts ?? []).map((p: any) => [p.slug, p]));
  const productBySlug = new Map<string, any>((products ?? []).map((p: any) => [p.slug, p]));
  const signals: SignalInput[] = [];

  for (const e of events ?? []) {
    const at = new Date(e.occurred_at);
    const meta = (e.metadata ?? {}) as Record<string, any>;
    const post = e.ref_slug ? postBySlug.get(e.ref_slug) : null;
    const product = e.ref_slug ? productBySlug.get(e.ref_slug) : null;
    const dims: Record<string, unknown> = {
      season: seasonOf(at),
      publish_dow: DOW[at.getUTCDay()],
      publish_hour: String(at.getUTCHours()).padStart(2, "0"),
      ...(post ? { blog_format: blogFormat(post), headline_style: headlineStyle(post.title), category: post.category ?? "uncategorised" } : {}),
      ...(product ? { category: product.category_id ?? "cookbook" } : {}),
      ...(meta.section ? { homepage_section: String(meta.section) } : {}),
      ...(meta.cta ? { cta_style: String(meta.cta) } : {}),
      ...(meta.style ? { pin_style: String(meta.style) } : {}),
    };
    const metric =
      e.kind === "page_view" && post ? "blog_views"
      : e.kind === "page_view" ? "page_views"
      : e.kind === "recipe_view" ? "recipe_views"
      : e.kind === "homepage_click" ? "homepage_clicks"
      : e.kind === "internal_link_click" ? "internal_link_clicks"
      : e.kind === "cta_click" ? "cta_clicks"
      : e.kind === "checkout_start" ? "checkout_starts"
      : e.kind === "purchase" ? "sales"
      : String(e.kind);
    signals.push({
      source: "derived:analytics",
      metric,
      value: Number(meta.value ?? 1),
      entity_type: post ? "blog" : product ? "product" : "page",
      entity_ref: e.ref_slug ?? null,
      dimensions: dims,
      occurred_at: e.occurred_at,
    });
  }

  for (const p of posts ?? []) {
    if (!p.published_at) continue;
    const at = new Date(p.published_at);
    signals.push({
      source: "derived:blog",
      metric: "published",
      value: 1,
      entity_type: "blog",
      entity_id: p.id,
      entity_ref: p.slug,
      dimensions: {
        blog_format: blogFormat(p),
        headline_style: headlineStyle(p.title),
        category: p.category ?? "uncategorised",
        cluster: (p.tags ?? [])[0] ?? "general",
        publish_dow: DOW[at.getUTCDay()],
        publish_hour: String(at.getUTCHours()).padStart(2, "0"),
        season: seasonOf(at),
      },
      occurred_at: p.published_at,
    });
  }

  for (const pin of pins ?? []) {
    const at = new Date(pin.published_at ?? pin.created_at);
    signals.push({
      source: "derived:pinterest",
      metric: pin.status === "published" ? "pins_published" : "pins_created",
      value: 1,
      entity_type: "pin",
      entity_id: pin.id,
      dimensions: {
        headline_style: headlineStyle(pin.title),
        publish_dow: DOW[at.getUTCDay()],
        publish_hour: String(at.getUTCHours()).padStart(2, "0"),
        season: seasonOf(at),
      },
      occurred_at: at.toISOString(),
    });
  }

  for (const d of dl ?? []) {
    const at = new Date(d.created_at);
    signals.push({
      source: "derived:commerce",
      metric: "downloads",
      value: Number(d.download_count ?? 1),
      entity_type: "product",
      dimensions: { season: seasonOf(at), publish_dow: DOW[at.getUTCDay()] },
      occurred_at: d.created_at,
    });
  }

  await db.from("learning_signals").delete().like("source", "derived:%");
  for (let i = 0; i < signals.length; i += 500) {
    const chunk = signals.slice(i, i + 500);
    if (chunk.length) await recordSignals(chunk);
  }
  return signals.length;
}

export type ComputedInsight = {
  dimension: string;
  dimension_value: string;
  metric: string;
  sample_size: number;
  score: number;
  lift_pct: number;
  confidence: number;
  summary: string;
  evidence: Record<string, unknown>;
};

/** Groups every signal by dimension value and measures lift against the metric average. */
export async function computeInsights(windowDays = 90): Promise<ComputedInsight[]> {
  const db = await admin();
  const since = new Date(Date.now() - windowDays * 864e5).toISOString();
  const { data: signals } = await db
    .from("learning_signals")
    .select("metric, value, dimensions, occurred_at")
    .gte("occurred_at", since)
    .limit(20000);

  const buckets = new Map<string, { values: number[]; metric: string; dim: string; val: string }>();
  const metricTotals = new Map<string, number[]>();

  for (const s of signals ?? []) {
    const dims = (s.dimensions ?? {}) as Record<string, string>;
    const v = Number(s.value) || 0;
    if (!metricTotals.has(s.metric)) metricTotals.set(s.metric, []);
    metricTotals.get(s.metric)!.push(v);
    for (const dim of LEARNED_DIMENSIONS) {
      const val = dims[dim];
      if (!val) continue;
      const key = `${dim}|${val}|${s.metric}`;
      if (!buckets.has(key)) buckets.set(key, { values: [], metric: s.metric, dim, val: String(val) });
      buckets.get(key)!.values.push(v);
    }
  }

  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const out: ComputedInsight[] = [];

  for (const b of buckets.values()) {
    if (b.values.length < 3) continue; // not enough evidence to claim a pattern
    const all = metricTotals.get(b.metric) ?? [];
    const baseline = avg(all);
    const mean = avg(b.values);
    const score = b.values.reduce((x, y) => x + y, 0);
    const lift = baseline > 0 ? ((mean - baseline) / baseline) * 100 : 0;
    const share = all.length ? b.values.length / all.length : 0;
    const confidence = Math.min(0.95, 0.25 + Math.log10(b.values.length + 1) * 0.35 + share * 0.2);
    out.push({
      dimension: b.dim,
      dimension_value: b.val,
      metric: b.metric,
      sample_size: b.values.length,
      score: Number(score.toFixed(2)),
      lift_pct: Number(lift.toFixed(1)),
      confidence: Number(confidence.toFixed(2)),
      summary:
        lift >= 0
          ? `${b.val} outperforms the average on ${b.metric.replace(/_/g, " ")} by ${lift.toFixed(0)}% across ${b.values.length} data points.`
          : `${b.val} underperforms on ${b.metric.replace(/_/g, " ")} by ${Math.abs(lift).toFixed(0)}% across ${b.values.length} data points.`,
      evidence: { mean: Number(mean.toFixed(2)), baseline: Number(baseline.toFixed(2)), window_days: windowDays },
    });
  }

  out.sort((a, b) => b.lift_pct * b.confidence - a.lift_pct * a.confidence);
  return out;
}

export async function persistInsights(insights: ComputedInsight[], windowDays: number) {
  const db = await admin();
  const rows = insights.slice(0, 300).map((i) => ({
    ...i,
    window_days: windowDays,
    status: "active",
    computed_at: new Date().toISOString(),
  }));
  if (!rows.length) return 0;
  const { error } = await db
    .from("learning_insights")
    .upsert(rows, { onConflict: "dimension,dimension_value,metric,window_days" });
  if (error) throw new Error(error.message);
  return rows.length;
}

export async function getBrandRules() {
  const db = await admin();
  const { data } = await db
    .from("brand_rules")
    .select("category, rule, weight")
    .eq("active", true)
    .order("weight", { ascending: false });
  return (data ?? []) as { category: string; rule: string; weight: number }[];
}

/**
 * The prompt block injected into every generation so the AI never forgets
 * what it has learned or what the brand sounds like.
 */
export async function getMemoryContext(
  kind: "blog" | "pinterest" | "product" | "image" | "general" = "general",
) {
  const db = await admin();
  const relevant: Record<string, string[]> = {
    blog: ["blog_format", "headline_style", "category", "cluster", "publish_dow", "publish_hour", "season", "link_strategy"],
    pinterest: ["pin_style", "image_style", "headline_style", "publish_dow", "publish_hour", "season"],
    product: ["cta_style", "category", "headline_style"],
    image: ["image_style", "pin_style", "season"],
    general: [...LEARNED_DIMENSIONS],
  };
  const dims = relevant[kind] ?? relevant.general;

  const [{ data: insights }, { data: experiments }, rules] = await Promise.all([
    db.from("learning_insights").select("dimension, dimension_value, metric, lift_pct, confidence, sample_size")
      .eq("status", "active").in("dimension", dims).order("lift_pct", { ascending: false }).limit(14),
    db.from("ai_experiments").select("name, dimension, variants, hypothesis").eq("status", "running").limit(6),
    getBrandRules(),
  ]);

  const lines: string[] = [];
  lines.push("BRAND RULES (non-negotiable):");
  for (const r of rules) lines.push(`- [${r.category}] ${r.rule}`);

  if ((insights ?? []).length) {
    lines.push("", "WHAT THE BUSINESS HAS LEARNED (apply this, do not ignore it):");
    for (const i of insights!) {
      lines.push(
        `- ${i.dimension}=${i.dimension_value}: ${i.lift_pct > 0 ? "+" : ""}${i.lift_pct}% on ${i.metric} (n=${i.sample_size}, confidence ${i.confidence}).`,
      );
    }
  } else {
    lines.push("", "WHAT THE BUSINESS HAS LEARNED: not enough data yet — vary approaches deliberately so the engine can learn.");
  }

  const running = (experiments ?? []).filter((e: any) => (e.variants ?? []).length);
  if (running.length) {
    lines.push("", "ACTIVE EXPERIMENTS (deliberately vary these):");
    for (const e of running) {
      const variants = (e.variants as any[]).map((v: any) => (typeof v === "string" ? v : v?.name)).join(" | ");
      lines.push(`- ${e.name} (${e.dimension}): use one of ${variants}. ${e.hypothesis}`);
    }
    lines.push("Choose a variant deliberately and state which variant you used.");
  }

  return lines.join("\n");
}

/** Picks a variant for a running experiment on a dimension, if one exists. */
export async function pickExperimentVariant(dimension: string): Promise<string | null> {
  const db = await admin();
  const { data } = await db
    .from("ai_experiments")
    .select("variants")
    .eq("status", "running")
    .eq("dimension", dimension)
    .limit(1)
    .maybeSingle();
  const variants: any[] = data?.variants ?? [];
  if (!variants.length) return null;
  const v = variants[Math.floor(Math.random() * variants.length)];
  return typeof v === "string" ? v : (v?.name ?? null);
}
