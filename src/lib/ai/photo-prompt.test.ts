import { describe, it, expect } from "vitest";
import { cleanPhotoPrompt } from "./photo-prompt";
describe("cleanPhotoPrompt", () => {
  it("removes quoted CTA copy and step labels", () => {
    const out = cleanPhotoPrompt('Lentil salad, cooking step 3: Finish: fold in cranberries. CTA "Download the free recipe book"');
    expect(out).not.toContain("Download the free recipe book");
    expect(out).not.toMatch(/step 3/i);
    expect(out).toContain("no text");
  });
});
