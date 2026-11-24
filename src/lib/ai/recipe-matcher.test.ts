import { describe, it, expect } from "vitest";
import { dishesNeeded, matchRecipes } from "./blog-core.server";
import { BLOG_FORMATS } from "./blog-formats";

const catalog = [
  { slug: "vegan-gravy", title: "Easy Vegan Mushroom Gravy" },
  { slug: "green-beans", title: "Crispy Shallot Green Beans" },
  { slug: "tofu-scramble", title: "Tofu Breakfast Scramble" },
];

describe("smart recipe matcher", () => {
  it("needs the number in the title", () => {
    expect(dishesNeeded("7 Vegan Thanksgiving Side Dishes", BLOG_FORMATS.roundup)).toBe(7);
  });
  it("picks only recipes sharing a topic word", () => {
    const m = matchRecipes("Vegan Gravy and Green Beans for Thanksgiving", catalog, 5).map((r) => r.slug);
    expect(m).toEqual(expect.arrayContaining(["vegan-gravy", "green-beans"]));
    expect(m).not.toContain("tofu-scramble");
  });
  it("never returns more than needed", () => {
    expect(matchRecipes("gravy beans tofu", catalog, 2)).toHaveLength(2);
  });
});
