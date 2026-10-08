import { describe, it, expect } from "vitest";
import { buildFallbackWeek } from "./ai.functions";
import { RECIPES } from "@/prep-kit/data/recipes";

const base = { dislikes: [], allergies: [], pantry: [] };

describe("Suggest a week fallback", () => {
  it("fills all 28 slots", () => {
    const { slots } = buildFallbackWeek(RECIPES, base);
    const filled = Object.values(slots).flatMap((d) => Object.values(d)).filter(Boolean);
    expect(filled.length).toBe(28);
  });
  it("skips recipes containing an allergy", () => {
    const { slots } = buildFallbackWeek(RECIPES, { ...base, allergies: ["peanut"] });
    const ids = Object.values(slots).flatMap((d) => Object.values(d));
    const bad = RECIPES.filter((r) => `${r.title} ${r.ingredients.join(" ")}`.toLowerCase().includes("peanut")).map((r) => r.id);
    expect(ids.some((id) => bad.includes(id!))).toBe(false);
  });
});
