import { describe, expect, it } from "vitest";
import { recipeJsonLd, nutritionSchema } from "./recipe-schema";

const r: any = {
  title: "Thai Peanut Tofu Bowl", description: "d", tags: ["thai", "dinner"], servings: "4", prep_minutes: 10, cook_minutes: 20,
  ingredients: [{ items: ["tofu"] }], instructions: [{ title: null, body: "Press the tofu. Then slice." }],
  nutrition: [{ label: "Calories", value: "450" }, { label: "Protein", value: "24g" }], published_at: null,
};

describe("recipe schema", () => {
  it("fills Google's recommended fields", () => {
    const s: any = recipeJsonLd(r, "https://x.com/recipes/a", "https://x.com/a.jpg");
    expect(s.author.name).toBe("PlantedAndSimple");
    expect(s.recipeCuisine).toBe("Thai, Plant-Based");
    expect(s.recipeCategory).toBe("Dinner");
    expect(s.recipeInstructions[0].name).toBe("Press the tofu");
    expect(s.recipeInstructions[0].url).toBe("https://x.com/recipes/a#step-1");
  });
  it("maps nutrition", () => {
    expect(nutritionSchema(r.nutrition)).toEqual({ "@type": "NutritionInformation", calories: "450 kcal", proteinContent: "24 g" });
  });
});
