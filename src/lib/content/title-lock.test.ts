import { describe, expect, it } from "vitest";
import { anchorSeoTitle, keepsTitle } from "./title-lock";

describe("title lock", () => {
  it("rejects an AI title that renames the recipe", () => {
    expect(anchorSeoTitle("Red Lentil Dahl", "Golden Spiced Lentil Curry Bowl")).toBe("Red Lentil Dahl · Planted & Simple");
  });
  it("accepts an enriched title that keeps the original", () => {
    expect(anchorSeoTitle("Red Lentil Dahl", "Red Lentil Dahl (Easy 30-Minute Recipe)")).toBe("Red Lentil Dahl (Easy 30-Minute Recipe)");
  });
  it("detects missing title", () => {
    expect(keepsTitle("Crispy Air Fryer Tofu", "Golden Sesame Tofu")).toBe(false);
  });
});
