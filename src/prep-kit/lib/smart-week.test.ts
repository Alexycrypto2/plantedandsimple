import { describe, expect, it } from "vitest";
import { buildSmartWeek } from "./smart-week";
import { RECIPES } from "../data/recipes";
import { DAYS, SLOTS } from "../data/types";
const prefs = { dislikes: [], allergies: [], pantry: [], proteinTarget: 100 };
describe("Smart week", () => {
  it("fills seven days and four meals per day from the real library", () => {
    const { slots } = buildSmartWeek(RECIPES, prefs);
    expect(DAYS.flatMap((d) => SLOTS.map((s) => slots[d]?.[s])).filter(Boolean)).toHaveLength(28);
  });
  it("never falls back to allergens when every recipe is excluded", () => {
    expect(() => buildSmartWeek(RECIPES, { ...prefs, allergies: RECIPES.map((r) => r.title) })).toThrow("No recipes match");
  });
  it("uses the selected 100g daily target when attainable", () => {
    const library = SLOTS.flatMap((category, i) => [
      { ...RECIPES[0], id: `${category}-low`, category, nutrition: { calories: 200, protein: 10, carbs: 20, fat: 5, fiber: 4 } },
      { ...RECIPES[0], id: `${category}-high`, category, nutrition: { calories: 300, protein: 30, carbs: 20, fat: 5, fiber: 4 } },
    ]) as typeof RECIPES;
    const { slots } = buildSmartWeek(library, prefs);
    for (const d of DAYS) expect(SLOTS.reduce((n, s) => n + (library.find((r) => r.id === slots[d]?.[s])?.nutrition.protein ?? 0), 0)).toBeGreaterThanOrEqual(100);
  });
});