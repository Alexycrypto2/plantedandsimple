import { sanitizeBlogHtml } from "./content-sanitize";

/** Reader-facing cleanup of saved blog HTML (does not change stored content). */
export function cleanBlogHtml(html: string): string {
  let out = sanitizeBlogHtml(html ?? "");
  // Free guide links must go through the signup page, never straight to the download.
  out = out.replace(/href=(["'])(?:https?:\/\/(?:www\.)?plantedandsimple\.com)?\/free-cookbook\/?\1/gi, 'href=$1/free$1');
  // Drop in-article promo boxes: the page already shows one mid-article card and one end card.
  out = out.replace(/<aside\b[^>]*class=(["'])[^"']*\barticle-(?:cta|product)\b[^"']*\1[^>]*>[\s\S]*?<\/aside>/gi, "");
  return out;
}

/** List every <img> in the HTML in order. */
export function listImages(html: string): { src: string; alt: string; heading: string }[] {
  const res: { src: string; alt: string; heading: string }[] = [];
  const re = /<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html ?? ""))) {
    const src = /\bsrc=(["'])(.*?)\1/i.exec(m[0])?.[2] ?? "";
    const alt = /\balt=(["'])(.*?)\1/i.exec(m[0])?.[2] ?? "";
    const before = (html ?? "").slice(0, m.index);
    const hs = [...before.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi)];
    const heading = hs.length ? hs[hs.length - 1][1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/^\s*\d+[.)]\s*/, "").trim() : "";
    res.push({ src, alt, heading });
  }
  return res;
}

/** Photo brief for one article photo: the dish in that section, never the whole article title. */
export function photoBrief(ph: { alt: string; heading: string }, articleTitle: string): string {
  const subject = (ph.heading && !/what you.ll learn|in this article|faq|timeline|table of contents/i.test(ph.heading) ? ph.heading : "") || ph.alt || articleTitle;
  return `${subject} — one single plated vegan dish as the hero, close-up, natural window light, editorial food photography, no text, no labels, no menu cards, no logos, no watermark`;
}

/** Replace the src of the n-th image, or remove its figure/img when src is null. */
export function setImage(html: string, index: number, src: string | null): string {
  let i = -1;
  if (src === null) {
    return html.replace(/<figure\b[^>]*>\s*<img\b[^>]*>[\s\S]*?<\/figure>|<img\b[^>]*>/gi, (block) => {
      i++;
      return i === index ? "" : block;
    });
  }
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    i++;
    if (i !== index) return tag;
    return /\bsrc=(["']).*?\1/i.test(tag) ? tag.replace(/\bsrc=(["']).*?\1/i, `src="${src}"`) : tag.replace(/<img/i, `<img src="${src}"`);
  });
}
