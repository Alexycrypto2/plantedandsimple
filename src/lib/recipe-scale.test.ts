import { describe, it, expect } from "vitest";
import { scaleLine, baseServings } from "./recipe-scale";

describe("scaleLine", () => {
  it("doubles a mixed fraction", () => expect(scaleLine("1 1/2 cups oats", 2)).toBe("3 cups oats"));
  it("halves a whole number", () => expect(scaleLine("2 tbsp soy sauce", 0.5)).toBe("1 tbsp soy sauce"));
  it("scales unicode fractions", () => expect(scaleLine("½ tsp salt", 2)).toBe("1 tsp salt"));
  it("scales ranges", () => expect(scaleLine("2-3 cloves garlic", 2)).toBe("4–6 cloves garlic"));
  it("leaves lines without a quantity alone", () => expect(scaleLine("Salt to taste", 3)).toBe("Salt to taste"));
  it("reads servings", () => expect(baseServings("4 servings")).toBe(4));
});
