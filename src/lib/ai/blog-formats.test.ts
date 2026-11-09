import { describe, expect, it } from "vitest";
import { detectBlogFormat, findBannedPhrases } from "./blog-formats";

describe("detectBlogFormat", () => {
  it("numbered lists are roundups", () => expect(detectBlogFormat("12 High-Protein Vegan Dinners Under 25 Minutes")).toBe("roundup"));
  it("how-to titles are technique posts", () => expect(detectBlogFormat("How to Press and Crisp Tofu")).toBe("how_to"));
  it("meal prep wins over numbers", () => expect(detectBlogFormat("5 Day Vegan Meal Prep for Work")).toBe("meal_prep"));
  it("protein questions are nutrition guides", () => expect(detectBlogFormat("Getting Enough Plant Protein Without Powders")).toBe("nutrition_guide"));
  it("dish names are hero recipes", () => expect(detectBlogFormat("Creamy Tuscan White Bean Skillet")).toBe("hero_recipe"));
});

describe("findBannedPhrases", () => {
  it("flags AI vocabulary", () => expect(findBannedPhrases("Let's delve into this game-changer")).toEqual(["delve", "game-changer"]));
});
