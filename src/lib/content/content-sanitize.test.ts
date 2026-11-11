import { describe, expect, it } from "vitest";
import { dropEmptyDetails, fixSiteLinks, inferHolidayTaxonomy, normalizeCategory } from "./content-sanitize";

describe("content sanitize", () => {
  it("turns protocol-less own-domain links into root paths", () => {
    expect(fixSiteLinks('<a href="plantedandsimple.com/free">x</a>')).toBe('<a href="/free">x</a>');
    expect(fixSiteLinks('<a href="https://www.plantedandsimple.com/recipes/a">x</a>')).toBe('<a href="/recipes/a">x</a>');
    expect(fixSiteLinks('<a href="https://example.com/free">x</a>')).toBe('<a href="https://example.com/free">x</a>');
  });
  it("removes FAQ questions without an answer", () => {
    expect(dropEmptyDetails("<details><summary>Q?</summary></details><details><summary>A?</summary><p>Yes</p></details>")).toBe("<details><summary>A?</summary><p>Yes</p></details>");
  });
  it("fixes the Sessional category typo", () => {
    expect(normalizeCategory("Sessional ")).toBe("Seasonal");
  });
  it("tags Thanksgiving recipes from their text", () => {
    expect(inferHolidayTaxonomy({ title: "Pumpkin pie", description: "A Thanksgiving dessert", tags: [], occasions: [] })).toEqual({ tags: ["thanksgiving"], occasions: ["thanksgiving"] });
  });
});
