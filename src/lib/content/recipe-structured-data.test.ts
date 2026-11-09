import { describe, expect, it } from "vitest";
import { validateRecipeScripts } from "./recipe-structured-data";
import { recipeJsonLd } from "../recipe-schema";
import { auditSeo } from "./seo-doctor";

const minimal = { "@type": "Recipe", name: "Tofu bowl", image: "https://plantedandsimple.com/tofu.jpg" };
const audit = (value: unknown) => validateRecipeScripts([JSON.stringify(value)]);
const failures = (value: unknown) => audit(value).errors.filter((e) => !e.pass);
describe("rendered Recipe JSON-LD validation", () => {
  it("requires name", () => { expect(failures({ ...minimal, name: " " }).map((e) => e.property)).toContain("name"); });
  it("requires an image with an absolute web URL", () => { expect(failures({ ...minimal, image: "/tofu.jpg" }).map((e) => e.property)).toContain("image"); });
  it("does not make absent recommendations blockers", () => {
    expect(failures(minimal)).toEqual([]);
    expect(audit(minimal).recommendations.find((e) => e.property === "nutrition.calories")?.pass).toBe(false);
  });
  it("requires a servings count with calories, not just an item yield", () => {
    expect(failures({ ...minimal, nutrition: { "@type": "NutritionInformation", calories: "300 kcal" }, recipeYield: "24 cookies" }).map((e) => e.property)).toContain("recipeYield (when per-serving nutrition supplied)");
    expect(failures({ ...minimal, nutrition: { calories: "300 kcal" }, recipeYield: "4 servings" })).toEqual([]);
  });
  it("requires servings with other per-serving nutrition too", () => {
    expect(failures({ ...minimal, nutrition: { proteinContent: "20 g" } })).toHaveLength(1);
  });
  it("accepts graph references and ImageObjects", () => {
    expect(failures({ "@graph": [{ ...minimal, "@type": ["Recipe"], image: { "@id": "#photo" } }, { "@id": "#photo", "@type": "ImageObject", contentUrl: minimal.image }] })).toEqual([]);
  });
  it("rejects malformed supplied steps", () => {
    expect(failures({ ...minimal, recipeInstructions: [{ "@type": "HowToStep", name: "Cook" }] }).map((e) => e.property)).toContain("recipeInstructions format (when supplied)");
  });
  it("accepts grouped steps and subdirections", () => {
    expect(failures({ ...minimal, recipeInstructions: [{ "@type": "HowToSection", name: "Cook", itemListElement: [{ "@type": "HowToStep", itemListElement: [{ "@type": "HowToDirection", text: "Stir." }] }] }] })).toEqual([]);
  });
  it("requires both prep and cook when either is provided, but accepts totalTime alone", () => {
    expect(audit({ ...minimal, prepTime: "PT10M" }).recommendations.find((e) => e.property.startsWith("prepTime"))?.pass).toBe(false);
    expect(audit({ ...minimal, totalTime: "PT10M" }).recommendations.find((e) => e.property.startsWith("prepTime"))?.pass).toBe(true);
    expect(audit({ ...minimal, prepTime: "10 min", cookTime: "PT0M" }).recommendations.find((e) => e.property.startsWith("prepTime"))?.pass).toBe(false);
  });
  it("reports malformed JSON and missing Recipe objects", () => {
    expect(validateRecipeScripts(["{"]).errors.filter((e) => !e.pass)).toHaveLength(2);
    expect(failures({ "@type": "Article" }).map((e) => e.property)).toContain("Recipe");
  });
  it("checks serialized route output rather than inferred editor flags", () => {
    const recipe: Parameters<typeof recipeJsonLd>[0] = { id: "test", slug: "tofu", title: "Tofu bowl", subtitle: null, description: "Cook tofu.", tags: [], servings: "2", ingredients: [{ items: ["200 g tofu"] }], instructions: [{ body: "Cook tofu." }], nutrition: [], tips: [], hero_image_id: null, hero_image_url: null, gallery_ids: [], gallery_urls: [], prep_minutes: null, cook_minutes: null, difficulty: "Easy", pinterest_description: null, seo_title: null, seo_description: null, status: "published", is_featured: false, published_at: null };
    const schema = recipeJsonLd(recipe, "https://plantedandsimple.com/recipes/tofu");
    expect(failures(schema).map((e) => e.property)).toContain("image");
    expect(failures({ ...schema, image: [minimal.image] })).toEqual([]);
  });
  it("does not treat ingredient or step counts as Google minimums", () => {
    const report = auditSeo({ title: "Tofu", seoTitle: "Tofu", seoDescription: "Tofu", kind: "recipe", html: '<h2>Ingredients</h2><ul><li>200 g tofu</li></ul><h2>Instructions</h2><ul><li>Cook.</li></ul>' });
    expect(report.checks.find((c) => c.id === "ingredients")?.pass).toBe(true);
    expect(report.checks.find((c) => c.id === "steps")?.pass).toBe(true);
    expect(report.checks.some((c) => c.id === "photo" || c.id === "pin_desc")).toBe(false);
  });
});