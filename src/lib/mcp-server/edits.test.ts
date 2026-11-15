import { describe, it, expect } from "vitest";
import { applyContentEdits } from "./tools.server";

describe("MCP content edits", () => {
  it("renames a heading, sets alt text and adds one internal link", () => {
    const html = `<h2>Old</h2><p>Try our tofu scramble today. tofu scramble again.</p><img src="/a.jpg">`;
    const out = applyContentEdits(html, { headings: [{ from: "Old", to: "New" }], alt_text: [{ src: "/a.jpg", alt: "Tofu" }], internal_links: [{ anchor: "tofu scramble", href: "/recipes/tofu-scramble" }] });
    expect(out).toContain("<h2>New</h2>");
    expect(out).toContain('alt="Tofu"');
    expect(out.match(/<a /g)?.length).toBe(1);
  });
});
