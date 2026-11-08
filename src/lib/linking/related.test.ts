import { describe, expect, it } from "vitest";
import { chooseRelated, hubItems, scorePage, type LinkPage } from "./related";

const NOW = new Date("2026-11-08T00:00:00Z").getTime();
const page = (p: Partial<LinkPage> & { slug: string }): LinkPage => ({
  type: "recipe", id: p.slug, title: p.slug, image: null, prep_minutes: 10, difficulty: "easy",
  published_at: "2026-01-01T00:00:00Z", category: null, occasions: [], main_ingredients: [], diet_tags: [], ...p,
});

describe("internal link scoring", () => {
  it("adds +3 category, +3 occasion, +2 ingredient, +1 diet, +1 recent", () => {
    const a = page({ slug: "a", category: "Dinner", occasions: ["Thanksgiving"], main_ingredients: ["Lentil"], diet_tags: ["Vegan"] });
    const b = page({ slug: "b", category: "Dinner", occasions: ["Thanksgiving"], main_ingredients: ["Lentil"], diet_tags: ["Vegan"], published_at: "2026-11-01T00:00:00Z" });
    expect(scorePage(a, b, NOW)).toBe(10);
  });

  it("never links a page to itself and fills with newest recipes", () => {
    const cur = page({ slug: "cur", category: "Dinner" });
    const pool = [cur, page({ slug: "match", category: "Dinner" }), page({ slug: "new", published_at: "2026-06-01T00:00:00Z" }), page({ slug: "old" }), page({ slug: "older", published_at: "2025-01-01T00:00:00Z" })];
    const r = chooseRelated(cur, pool, [], NOW);
    const slugs = r.recipes.map((x) => x.page.slug);
    expect(slugs).not.toContain("cur");
    expect(slugs).toEqual(["match", "new", "old", "older"]);
  });

  it("keeps the same order between loads", () => {
    const cur = page({ slug: "cur" });
    const pool = ["c", "a", "b", "d", "e"].map((s) => page({ slug: s }));
    expect(chooseRelated(cur, pool, [], NOW).recipes.map((x) => x.page.slug)).toEqual(["a", "b", "c", "d"]);
  });

  it("hub lists every page tagged with the occasion, newest first", () => {
    const pages = [page({ slug: "x", occasions: ["Thanksgiving"] }), page({ slug: "y", occasions: ["thanksgiving"], published_at: "2026-10-01T00:00:00Z" }), page({ slug: "z" })];
    expect(hubItems("Thanksgiving", pages).map((p) => p.slug)).toEqual(["y", "x"]);
  });
});
