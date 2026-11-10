import { describe, it, expect } from "vitest";
import { cleanBlogHtml, listImages, setImage } from "./blog-clean";

describe("blog cleanup", () => {
  it("sends free-cookbook links to /free signup", () => {
    expect(cleanBlogHtml('<a href="/free-cookbook">x</a>')).toBe('<a href="/free">x</a>');
    expect(cleanBlogHtml('<a href="https://plantedandsimple.com/free-cookbook">x</a>')).toBe('<a href="/free">x</a>');
  });
  it("removes in-article promo boxes including empty ones", () => {
    expect(cleanBlogHtml('<p>a</p><aside class="article-cta"><p></p></aside>')).toBe("<p>a</p>");
    expect(cleanBlogHtml('<aside class="article-callout"><p>tip</p></aside>')).toContain("tip");
  });
  it("swaps and removes the chosen photo only", () => {
    const h = '<img src="a.jpg" alt="A"><figure class="article-figure"><img src="b.jpg" alt="B"><figcaption>B</figcaption></figure>';
    expect(listImages(setImage(h, 1, "c.jpg")).map((x) => x.src)).toEqual(["a.jpg", "c.jpg"]);
    expect(listImages(setImage(h, 1, null)).map((x) => x.src)).toEqual(["a.jpg"]);
  });
});
