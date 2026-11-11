import { describe, it, expect } from "vitest";
import { draftNutritionRows } from "./blog-core.server";
describe("draft recipe nutrition", () => {
  it("labels every value as estimated", () => {
    const rows = draftNutritionRows({ calories: 264.4, protein_g: 8, carbs_g: 43, fat_g: 8, fiber_g: 7, sugar_g: 2, sodium_mg: 420 });
    expect(rows[0]).toEqual({ label: "Calories", value: "264 kcal (estimated)" });
    expect(rows.every((r) => r.value.endsWith("(estimated)"))).toBe(true);
  });
});
