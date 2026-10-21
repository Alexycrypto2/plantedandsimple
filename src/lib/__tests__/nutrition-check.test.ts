import { describe, expect, it } from "vitest";
import { fixCalories } from "../nutrition-check";

describe("fixCalories", () => {
  it("recomputes calories when they drift over 10% from macros", () => {
    const out = fixCalories([
      { label: "Calories", value: "300 kcal" },
      { label: "Protein", value: "25 g" },
      { label: "Carbs", value: "40 g" },
      { label: "Fat", value: "15 g" },
    ]);
    expect(out[0]!.value).toBe("395 kcal");
  });
  it("keeps calories within 10% of macros", () => {
    const out = fixCalories([
      { label: "Calories", value: "380 kcal" },
      { label: "Protein", value: "25 g" },
      { label: "Carbs", value: "40 g" },
      { label: "Fat", value: "15 g" },
    ]);
    expect(out[0]!.value).toBe("380 kcal");
  });
});
