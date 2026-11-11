import { describe, expect, it } from "vitest";
import { homepageOrder, toggleHomepageTag, stripHomepageTag } from "./homepage-pick";

describe("homepage blog pick", () => {
  it("puts pinned posts before newer unpinned posts", () => {
    const out = homepageOrder([
      { id: "new", tags: [], published_at: "2026-11-10" },
      { id: "pinned", tags: ["homepage"], published_at: "2026-01-01" },
    ]);
    expect(out.map((p) => p.id)).toEqual(["pinned", "new"]);
  });
  it("adds and removes the pin without touching other tags", () => {
    expect(toggleHomepageTag("vegan, fall", true)).toBe("vegan, fall, homepage");
    expect(stripHomepageTag("vegan, homepage")).toBe("vegan");
  });
});
