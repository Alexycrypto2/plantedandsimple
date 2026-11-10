import { describe, it, expect } from "vitest";
import { stepTimerSeconds } from "./RecipeTools";
describe("stepTimerSeconds", () => {
  it("reads minutes", () => expect(stepTimerSeconds("Bake for 25 minutes until golden")).toBe(1500));
  it("uses the upper bound of a range", () => expect(stepTimerSeconds("Simmer 10–12 min")).toBe(720));
  it("reads hours", () => expect(stepTimerSeconds("Press for 1 hour")).toBe(3600));
  it("returns null without a time", () => expect(stepTimerSeconds("Whisk the glaze")).toBeNull());
});
