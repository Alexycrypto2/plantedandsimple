import { describe, it, expect } from "vitest";
import { pickOffer, injectOffer, OFFERS } from "../content/product-bridge";
import { auditSeo, recipeToHtml } from "../content/seo-doctor";

describe("product bridge", () => {
  it("meal prep topics promote the Meal Prep System", () => {
    expect(pickOffer("Sunday meal prep for a busy week").key).toBe("prep");
  });
  it("high-protein recipes promote the cookbook", () => {
    expect(pickOffer("Crispy high-protein tofu dinner").key).toBe("cookbook");
  });
  it("general topics promote the free cookbook", () => {
    expect(pickOffer("Why go plant-based?").key).toBe("free");
  });
  it("injects the card only once", () => {
    const html = "<h2>a</h2><p>x</p><h2>b</h2><p>y</p><h2>c</h2>";
    const once = injectOffer(html, OFFERS.free);
    expect(injectOffer(once, OFFERS.free)).toBe(once);
  });
});

describe("seo doctor", () => {
  it("scores a thin post below the 85 pass mark", () => {
    const r = auditSeo({ title: "Tofu", seoTitle: "Tofu", seoDescription: "", html: "<p>short</p>", keyword: "tofu" });
    expect(r.score).toBeLessThan(85);
  });
  it("flags a too-long SEO title", () => {
    const r = auditSeo({ title: "x", seoTitle: "a".repeat(70), seoDescription: "", html: "", keyword: "a" });
    expect(r.checks.find((c) => c.id === "title_len")!.pass).toBe(false);
  });
});

describe("recipe seo doctor", () => {
  it("judges recipes on ingredients, not article length", () => {
    const html = recipeToHtml({ description: "d", ingredients: ["a", "b"], instructions: [], nutrition: [], tips: [] });
    const r = auditSeo({ title: "t", seoTitle: "t", seoDescription: "", html, kind: "recipe" });
    expect(r.checks.find((c) => c.id === "ingredients")!.pass).toBe(false);
    expect(r.checks.some((c) => c.id === "h2_count")).toBe(false);
  });
});
