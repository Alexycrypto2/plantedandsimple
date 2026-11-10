import { describe, expect, it } from "vitest";
import { auditSeo, hasAmount, recipeToHtml } from "./seo-doctor";
import { pickKeyword } from "@/components/admin/SeoDoctor";

describe("SEO Doctor recipe fixes", () => {
  it("never picks a category tag like 'vegan main' that isn't in the title", () => {
    expect(pickKeyword("vegan, main, dinner", "Maple Glazed Tofu Roast")).toBe("");
    const r = auditSeo({ title: "Maple Glazed Tofu Roast", seoTitle: "Maple Glazed Tofu Roast · Planted & Simple", seoDescription: "", html: "", keyword: "", kind: "recipe" });
    expect(r.keyword).toBe("maple glazed tofu");
  });

  it("does not treat a bullet list as one long sentence", () => {
    const html = recipeToHtml({
      description: "Sticky maple tofu. Easy and festive.",
      ingredients: ["2 blocks tofu", "3 tbsp maple syrup", "2 tbsp soy sauce", "1 tbsp mustard", "1 tsp paprika", "1 tsp garlic powder"],
      instructions: ["Heat the oven", "Score the tofu", "Brush with glaze", "Bake until golden"],
      nutrition: [], tips: [],
    });
    const r = auditSeo({ title: "Maple Glazed Tofu Roast", seoTitle: "", seoDescription: "", html, kind: "recipe" });
    expect(r.checks.find((c) => c.id === "readability")?.pass).toBe(true);
  });

  it("accepts garnish and descriptive amounts, flags truly missing ones", () => {
    expect(hasAmount("Fresh parsley, for garnish")).toBe(true);
    expect(hasAmount("Juice of half a lemon")).toBe(true);
    expect(hasAmount("Olive oil for brushing")).toBe(true);
    expect(hasAmount("Fresh parsley")).toBe(false);
  });
});
