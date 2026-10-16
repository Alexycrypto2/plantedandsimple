/** Live trend signal collectors used by the Trend Radar. All calls are best-effort. */

export type TrendSignal = { source: string; items: string[] };

/** Google Trends daily trending searches (public RSS, no key required). */
export async function googleTrends(geo = "US"): Promise<TrendSignal> {
  try {
    const res = await fetch(`https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PrimeDownloads/1.0)" },
    });
    if (!res.ok) return { source: "Google Trends", items: [] };
    const xml = await res.text();
    const items = Array.from(xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g))
      .map((m) => m[1]!.trim())
      .filter((t) => t && !/^daily search trends/i.test(t))
      .slice(0, 40);
    return { source: "Google Trends", items };
  } catch {
    return { source: "Google Trends", items: [] };
  }
}

/** Pinterest trending keywords for the connected account (needs the trends scope; optional). */
export async function pinterestTrends(userId: string): Promise<TrendSignal> {
  try {
    const { getAccessToken, pinterestFetch } = await import("@/lib/pinterest.server");
    const token = await getAccessToken(userId);
    if (!token) return { source: "Pinterest Trends", items: [] };
    const res = await pinterestFetch(token, "/trends/keywords/US/top/growing?limit=25");
    const items = ((res?.trends ?? res?.items ?? []) as any[])
      .map((t) => t?.keyword ?? t?.query ?? "")
      .filter(Boolean)
      .slice(0, 25);
    return { source: "Pinterest Trends", items };
  } catch {
    return { source: "Pinterest Trends", items: [] };
  }
}

/** Reddit food-community risers — a strong early signal for recipe search demand. */
export async function redditFoodTrends(): Promise<TrendSignal> {
  const subs = ["veganrecipes", "PlantBasedDiet", "MealPrepSunday", "EatCheapAndHealthy"];
  const items: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        const res = await fetch(`https://www.reddit.com/r/${s}/top.json?t=week&limit=12`, {
          headers: { "User-Agent": "PrimeDownloads/1.0 trend-radar" },
        });
        if (!res.ok) return;
        const json: any = await res.json();
        for (const c of json?.data?.children ?? []) {
          const title = c?.data?.title;
          if (title) items.push(`r/${s}: ${String(title).slice(0, 120)}`);
        }
      } catch {
        /* best effort */
      }
    }),
  );
  return { source: "Reddit food communities", items: items.slice(0, 40) };
}

/** Real Google Autocomplete suggestions — phrases people actually type. Free, no key. */
export async function googleAutocomplete(seeds: string[]): Promise<TrendSignal> {
  const out = new Set<string>();
  const expanded = seeds.flatMap((s) => [s, `${s} for`, `${s} without`, `easy ${s}`]).slice(0, 16);
  await Promise.all(
    expanded.map(async (q) => {
      try {
        const res = await fetch(
          `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=${encodeURIComponent(q)}`,
          { headers: { "User-Agent": "Mozilla/5.0 (compatible; PlantedAndSimple/1.0)" } },
        );
        if (!res.ok) return;
        const json: any = await res.json();
        for (const s of (json?.[1] ?? []) as string[]) if (s && s.length < 90) out.add(s.toLowerCase());
      } catch {
        /* best effort */
      }
    }),
  );
  return { source: "Google Autocomplete (real searches)", items: Array.from(out).slice(0, 60) };
}

export function seedsFromNiche(niche: string): string[] {
  const base = niche
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 2)
    .slice(0, 4);
  return base.length ? base : ["high protein vegan meals", "vegan meal prep"];
}

export async function collectTrendSignals(userId: string, niche = ""): Promise<TrendSignal[]> {
  const [a, g, p, r] = await Promise.all([
    googleAutocomplete(seedsFromNiche(niche)),
    googleTrends(),
    pinterestTrends(userId),
    redditFoodTrends(),
  ]);
  return [a, g, p, r].filter((s) => s.items.length > 0);
}
