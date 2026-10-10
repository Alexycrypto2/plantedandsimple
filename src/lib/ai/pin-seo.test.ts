import { describe, expect, it } from "vitest";
import { alignPinDescription, alignPinTitle, primaryKeyword } from "./pin-seo";

describe("pin SEO wiring", () => {
  it("uses the recipe SEO title as the primary keyword", () => {
    expect(primaryKeyword("High Protein Tofu Noodles — PlantedAndSimple", "Tofu Noodles")).toBe("High Protein Tofu Noodles");
  });
  it("falls back to the recipe title", () => {
    expect(primaryKeyword(null, "Harissa Chickpea Bowl")).toBe("Harissa Chickpea Bowl");
  });
  it("front-loads the keyword and links to the real recipe", () => {
    const out = alignPinDescription("Quick dinner for busy weeks.", "Harissa Chickpea Bowl", "https://www.plantedandsimple.store/recipes/harissa");
    expect(out.startsWith("Harissa Chickpea Bowl")).toBe(true);
    expect(out).toContain("https://www.plantedandsimple.store/recipes/harissa");
  });
  it("adds the keyword to titles missing it", () => {
    expect(alignPinTitle("Easy weeknight dinner", "Tofu Noodles")).toBe("Tofu Noodles | Easy weeknight dinner");
  });
});
