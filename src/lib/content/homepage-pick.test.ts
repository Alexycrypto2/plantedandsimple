import { describe, it, expect } from "vitest";
import { homepageShelf, toggleHomepageTag } from "./homepage-pick";

describe("Homepage journal", () => {
  it("shows three published posts, with pinned posts first and no drafts", () => {
    const posts = [
      { id: "draft", status: "draft", tags: ["homepage"], published_at: "2026-11-14" },
      { id: "new", status: "published", tags: [], published_at: "2026-11-14" },
      { id: "pin", status: "published", tags: ["homepage"], published_at: "2026-11-01" },
      { id: "older", status: "published", tags: [], published_at: "2026-11-13" },
      { id: "last", status: "published", tags: [], published_at: "2026-11-12" },
    ];
    expect(homepageShelf(posts).map((p) => p.id)).toEqual(["pin", "new", "older"]);
  });
  it("keeps multi-word tags and the homepage choice when saving", () => {
    expect(toggleHomepageTag("vegan, high protein, ", true)).toBe("vegan, high protein, homepage");
    expect(toggleHomepageTag("vegan, high protein, homepage", false)).toBe("vegan, high protein");
  });
});