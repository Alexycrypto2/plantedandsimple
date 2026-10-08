import { describe, expect, it } from "vitest";
import { pageUrl, productSchema, jsonLd } from "../seo";

describe("public search URLs", () => {
  it("uses the requested PlantedAndSimple domain for each page", () => {
    expect(pageUrl("/recipes/chickpea-bowl")).toBe("https://www.plantedandsimple.store/recipes/chickpea-bowl");
  });
  it("uses the product's actual stored price rather than a fixed launch price", () => {
    const schema = JSON.parse(productSchema({ title: "Cookbook", description: "Recipes", slug: "cookbook", cover_image_url: null, price_cents: 999, currency: "usd", paddle_price_external_id: "cookbook" }).children);
    expect(schema.offers.price).toBe("9.99");
    expect(schema.offers.priceCurrency).toBe("USD");
  });
  it("does not allow content to terminate a metadata script", () => {
    expect(jsonLd({ name: "</script>" }).children).not.toContain("</script>");
  });
});