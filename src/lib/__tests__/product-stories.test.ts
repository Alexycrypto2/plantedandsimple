import { describe, expect, it } from "vitest";
import { PRODUCT_STORIES } from "@/components/site/product-stories";
import { productImage } from "@/components/site/ProductFamily";

describe("distinct product stories", () => {
  it("resolves three different bundled covers even when catalog images are missing", () => {
    const images = ["high-protein-cookbook", "meal-prep-system", "planning-kit"].map((slug) => productImage({ slug, cover_image_url: null }));
    expect(images.every(Boolean)).toBe(true);
    expect(new Set(images).size).toBe(3);
  });
  it("positions Meal Prep as an app rather than another PDF", () => {
    expect(PRODUCT_STORIES["meal-prep-system"].format).toBe("Paid access to the interactive Meal Prep app");
    expect(PRODUCT_STORIES["meal-prep-system"].gallery.some((image) => PRODUCT_STORIES["high-protein-cookbook"].gallery.some((other) => other.url === image.url))).toBe(false);
  });
  it("keeps the printable kit gallery separate from cookbook and app galleries", () => {
    const otherImages = [...PRODUCT_STORIES["high-protein-cookbook"].gallery, ...PRODUCT_STORIES["meal-prep-system"].gallery].map((image) => image.url);
    expect(PRODUCT_STORIES["planning-kit"].gallery.length).toBe(3);
    expect(PRODUCT_STORIES["planning-kit"].gallery.some((image) => otherImages.includes(image.url))).toBe(false);
  });
});