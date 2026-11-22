import { describe, expect, it } from "vitest";
import { computeBadges, longestStreak, savings } from "./badges";

const base = { mealsLogged: 0, bestStreak: 0, goalDays: 0, plannedMeals: 0, prepComplete: false, groceryComplete: false, favourites: 0 };

describe("badges", () => {
  it("has 12 badges, none earned for a new member", () => {
    const b = computeBadges(base);
    expect(b).toHaveLength(12);
    expect(b.filter((x) => x.earned)).toHaveLength(0);
  });
  it("earns Week Champion at a 7-day streak", () => {
    expect(computeBadges({ ...base, bestStreak: 7 }).find((x) => x.id === "streak-7")?.earned).toBe(true);
    expect(computeBadges({ ...base, bestStreak: 6 }).find((x) => x.id === "streak-7")?.earned).toBe(false);
  });
  it("counts the longest consecutive run across month ends", () => {
    expect(longestStreak(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-05"])).toBe(3);
  });
  it("estimates $8 and 15 minutes saved per meal", () => {
    expect(savings(10)).toEqual({ dollars: 80, hours: 2.5 });
  });
});
