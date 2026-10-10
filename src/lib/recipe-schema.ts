import type { Recipe } from "@/lib/library/types";

const CUISINES = ["mediterranean", "mexican", "thai", "indian", "italian", "japanese", "korean", "chinese", "middle eastern", "levantine", "moroccan", "african", "caribbean", "american", "greek", "vietnamese", "asian", "latin"];
const CATEGORIES: Array<[string, string]> = [
  ["breakfast", "Breakfast"], ["lunch", "Lunch"], ["dinner", "Dinner"], ["meal prep", "Meal Prep"], ["meal-prep", "Meal Prep"],
  ["snack", "Snack"], ["dessert", "Dessert"], ["soup", "Soup"], ["salad", "Salad"], ["bowl", "Main Course"], ["smoothie", "Drink"],
];
const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** Maps free-form nutrition rows onto Schema.org NutritionInformation. */
export function nutritionSchema(rows: Recipe["nutrition"]) {
  const map: Record<string, [string, string]> = {
    calorie: ["calories", "kcal"], protein: ["proteinContent", "g"], carb: ["carbohydrateContent", "g"],
    fat: ["fatContent", "g"], fib: ["fiberContent", "g"], sugar: ["sugarContent", "g"], sodium: ["sodiumContent", "mg"],
  };
  const out: Record<string, string> = {};
  for (const row of rows ?? []) {
    const key = Object.keys(map).find((k) => row.label.toLowerCase().includes(k));
    const num = row.value.match(/[\d.]+/)?.[0];
    if (!key || !num) continue;
    const [field, unit] = map[key];
    if (!(key === "fat" && /saturated/i.test(row.label))) out[field] = `${num} ${unit}`;
  }
  return Object.keys(out).length ? { "@type": "NutritionInformation", ...out } : undefined;
}

export function recipeCuisine(r: Pick<Recipe, "tags" | "title">) {
  const hay = `${r.tags.join(" ")} ${r.title}`.toLowerCase();
  const found = CUISINES.find((c) => hay.includes(c));
  return found ? `${title(found)}, Plant-Based` : "Plant-Based";
}

export function recipeCategory(r: Pick<Recipe, "tags" | "title" | "categories">) {
  if (r.categories?.[0]?.name) return r.categories[0].name;
  const hay = `${r.tags.join(" ")} ${r.title}`.toLowerCase();
  return CATEGORIES.find(([k]) => hay.includes(k))?.[1] ?? "Main Course";
}

export function recipeJsonLd(r: Recipe, url: string, image?: string, siteUrl = "https://www.plantedandsimple.store") {
  const total = (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0);
  const brand = { "@type": "Organization", name: "PlantedAndSimple", url: siteUrl };
  const keywords = Array.from(new Set([...r.tags, "plant-based", "vegan"])).join(", ");
  return {
    "@context": "https://schema.org", "@type": "Recipe",
    name: r.title, description: r.description, image: image ? [image] : undefined, url,
    author: brand, publisher: brand,
    datePublished: r.published_at || undefined,
    recipeYield: r.servings ? `${r.servings} servings` : undefined,
    prepTime: r.prep_minutes ? `PT${r.prep_minutes}M` : undefined,
    cookTime: r.cook_minutes ? `PT${r.cook_minutes}M` : undefined,
    totalTime: total ? `PT${total}M` : undefined,
    recipeCategory: recipeCategory(r),
    recipeCuisine: recipeCuisine(r),
    suitableForDiet: "https://schema.org/VeganDiet",
    keywords,
    nutrition: nutritionSchema(r.nutrition),
    recipeIngredient: r.ingredients.flatMap((g) => g.items),
    recipeInstructions: r.instructions.map((s, i) => ({
      "@type": "HowToStep", position: i + 1,
      name: s.title?.trim() || s.body.split(/[.,;]/)[0].slice(0, 80),
      text: s.body, url: `${url}#step-${i + 1}`, image: image || undefined,
    })),
  };
}
