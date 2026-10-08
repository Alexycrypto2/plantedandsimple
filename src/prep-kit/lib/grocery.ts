import { RECIPE_BY_ID } from "@/data/content";
import { DAYS, SLOTS, type PlanSlots, type Recipe } from "@/data/types";

export const AISLES = [
  "Produce", "Plant Proteins", "Grains & Bread", "Canned & Jarred", "Sauces & Condiments",
  "Spices & Seasonings", "Nuts, Seeds & Butters", "Plant Milks & Chilled", "Frozen", "Baking & Sweeteners", "Other",
] as const;
export type Aisle = (typeof AISLES)[number];

const AISLE_WORDS: [Aisle, string[]][] = [
  ["Frozen", ["frozen"]],
  ["Plant Proteins", ["tofu", "tempeh", "seitan", "edamame", "protein powder", "lentil", "chickpea", "black bean", "white bean", "cannellini", "kidney bean", "pinto"]],
  ["Plant Milks & Chilled", ["soy milk", "oat milk", "almond milk", "coconut milk", "yogurt", "vegan mayo", "hummus", "tortilla"]],
  ["Grains & Bread", ["rice", "quinoa", "oats", "farro", "soba", "pasta", "spaghetti", "noodle", "bread", "roll", "sourdough", "pita", "flour"]],
  ["Nuts, Seeds & Butters", ["peanut butter", "almond butter", "cashew", "walnut", "almond", "peanut", "hemp", "chia", "sesame seed", "tahini", "flax", "pumpkin seed"]],
  ["Sauces & Condiments", ["tamari", "soy sauce", "sriracha", "salsa", "marinara", "bbq", "mustard", "vinegar", "maple", "hot sauce", "buffalo", "liquid smoke", "miso", "capers", "wine", "oil"]],
  ["Canned & Jarred", ["canned", "can ", "sun-dried", "tomato paste", "crushed tomato", "broth", "pickle"]],
  ["Spices & Seasonings", ["paprika", "cumin", "turmeric", "garlic powder", "onion powder", "chili", "curry", "cinnamon", "oregano", "salt", "pepper", "nutritional yeast", "garam", "cayenne", "thyme", "basil, dried", "italian seasoning", "kala namak", "ginger, ground"]],
  ["Baking & Sweeteners", ["cocoa", "chocolate", "dates", "vanilla", "baking", "agave", "sugar"]],
  ["Produce", ["onion", "garlic", "pepper", "tomato", "spinach", "kale", "lettuce", "romaine", "cucumber", "carrot", "celery", "broccoli", "potato", "avocado", "lemon", "lime", "banana", "berries", "berry", "cilantro", "parsley", "basil", "mint", "dill", "scallion", "green onion", "ginger", "cabbage", "mushroom", "zucchini", "herb", "apple", "radish", "jalapeño", "jalapeno", "corn", "cauliflower"]],
];

export function aisleFor(name: string): Aisle {
  const n = ` ${name.toLowerCase()} `;
  for (const [aisle, words] of AISLE_WORDS) if (words.some((w) => n.includes(w))) return aisle;
  return "Other";
}

const UNIT = "(?:cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|g|grams?|ml|cans?|blocks?|packages?|pkg|cloves?|pinch|handfuls?|bunch(?:es)?|scoops?|slices?|heads?|large|medium|small|stalks?|inch)";
const QTY_RE = new RegExp(`^\\s*((?:[\\d¼½¾⅓⅔/.\\-–\\s]+)(?:\\([^)]*\\)\\s*)?(?:${UNIT}\\.?\\s+)*)`, "i");

export function splitIngredient(line: string): { qty: string; name: string } {
  const m = line.match(QTY_RE);
  const qty = m?.[1]?.trim() ?? "";
  let name = (m ? line.slice(m[0].length) : line).trim();
  name = (name.replace(/^of\s+/i, "").split(",")[0] ?? "").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
  if (!name) name = line.trim();
  return { qty, name };
}

export function normalizeKey(name: string) {
  return name.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").replace(/s$/, "").trim();
}

export interface GroceryItem {
  key: string;
  name: string;
  aisle: Aisle;
  uses: { qty: string; recipe: string; times: number }[];
}

export function planRecipeCounts(slots: PlanSlots): Map<string, number> {
  const counts = new Map<string, number>();
  for (const d of DAYS) for (const s of SLOTS) {
    const id = slots[d]?.[s];
    if (id && RECIPE_BY_ID[id]) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** Deterministic: combine every ingredient line from the week's recipes. Each recipe
 * appears once per batch (servings from the cookbook); repeats are noted as "×n". */
export function buildGrocery(slots: PlanSlots): GroceryItem[] {
  const map = new Map<string, GroceryItem>();
  for (const [id, times] of planRecipeCounts(slots)) {
    const r: Recipe | undefined = RECIPE_BY_ID[id];
    if (!r) continue;
    for (const line of r.ingredients) {
      if (/to taste|optional$|for serving$/i.test(line) && !/\d/.test(line)) {
        // still list pantry-style items without qty
      }
      const { qty, name } = splitIngredient(line);
      const key = normalizeKey(name);
      if (!key) continue;
      const item = map.get(key) ?? { key, name: name.charAt(0).toUpperCase() + name.slice(1), aisle: aisleFor(line), uses: [] };
      item.uses.push({ qty, recipe: r.title, times });
      map.set(key, item);
    }
  }
  return [...map.values()].sort((a, b) => AISLES.indexOf(a.aisle) - AISLES.indexOf(b.aisle) || a.name.localeCompare(b.name));
}

export function inPantry(item: GroceryItem, pantry: string[]) {
  return pantry.some((p) => {
    const k = normalizeKey(p);
    return k && (item.key === k || item.key.includes(k) || k.includes(item.key));
  });
}
