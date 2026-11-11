import { describe, expect, it } from "vitest";
import { detectBlogFormat, findBannedPhrases } from "./blog-formats";

describe("detectBlogFormat", () => {
  it("numbered lists are roundups", () => expect(detectBlogFormat("12 High-Protein Vegan Dinners Under 25 Minutes")).toBe("roundup"));
  it("how-to titles are technique posts", () => expect(detectBlogFormat("How to Press and Crisp Tofu")).toBe("how_to"));
  it("meal prep wins over numbers", () => expect(detectBlogFormat("5 Day Vegan Meal Prep for Work")).toBe("meal_prep"));
  it("protein questions are nutrition guides", () => expect(detectBlogFormat("Getting Enough Plant Protein Without Powders")).toBe("nutrition_guide"));
  it("protein how-to questions are nutrition guides", () => expect(detectBlogFormat("How to get enough protein on a plant-based diet without supplements")).toBe("nutrition_guide"));
  it("high-protein dishes stay hero recipes", () => expect(detectBlogFormat("High Protein Vegan Pumpkin Chili in the Slow Cooker")).toBe("hero_recipe"));
  it("dish names are hero recipes", () => expect(detectBlogFormat("Creamy Tuscan White Bean Skillet")).toBe("hero_recipe"));
});

describe("findBannedPhrases", () => {
  it("flags AI vocabulary", () => expect(findBannedPhrases("Let's delve into this game-changer")).toEqual(["delve", "game-changer"]));
});

import { titleItemCount, sanitizeBanned, detectBlogFormat as dbf } from "./blog-formats";
describe("title promises", () => {
  it("reads the promised count", () => {
    expect(titleItemCount("Vegan Thanksgiving Side Dishes: 12 Easy High-Protein Ideas")).toBe(12);
    expect(titleItemCount("11 Cozy High-Protein Vegan Date Night Dinner Ideas")).toBe(11);
    expect(titleItemCount("25 satisfying high-protein vegan dinner recipes")).toBe(25);
    expect(titleItemCount("High-protein vegan meal prep for seven easy days")).toBeNull();
  });
  it("menus get the holiday format", () => {
    expect(dbf("Vegan Thanksgiving Menu: Mains, Sides & Make-Ahead Timeline")).toBe("holiday_menu");
  });
  it("swaps cliches", () => {
    expect(sanitizeBanned("Elevate your sides")).toBe("Lift your sides");
  });
});
