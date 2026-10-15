import { describe, it, expect } from "vitest";
import { cleanStep, cleanTip, cleanServings, usNutritionLabel } from "../recipe-clean";

describe("recipe cleanup", () => {
  it("strips leading step numbers", () => expect(cleanStep("1. Heat the oil.")).toBe("Heat the oil."));
  it("strips trailing comma after period", () => expect(cleanStep("Cook until golden.,")).toBe("Cook until golden."));
  it("strips leading dash on tips", () => expect(cleanTip("— Use tempeh")).toBe("Use tempeh"));
  it("normalizes servings", () => expect(cleanServings("4 servings")).toBe("4"));
  it("uses US Fiber", () => expect(usNutritionLabel("Fibre")).toBe("Fiber"));
});
