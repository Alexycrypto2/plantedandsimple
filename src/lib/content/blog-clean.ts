/** Reader-facing cleanup of saved blog HTML (does not change stored content). */
export function cleanBlogHtml(html: string): string {
  let out = html ?? "";
  // Free guide links must go through the signup page, never straight to the download.
  out = out.replace(/href=(["'])(?:https?:\/\/(?:www\.)?plantedandsimple\.com)?\/free-cookbook\/?\1/gi, 'href=$1/free$1');
  // Drop in-article promo boxes: the page already shows one mid-article card and one end card.
  out = out.replace(/<aside\b[^>]*class=(["'])[^"']*\barticle-(?:cta|product)\b[^"']*\1[^>]*>[\s\S]*?<\/aside>/gi, "");
  return out;
}

/** List every <img> in the HTML in order. */
export function listImages(html: string): { src: string; alt: string }[] {
  const res: { src: string; alt: string }[] = [];
  const re = /<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html ?? ""))) {
    const src = /\bsrc=(["'])(.*?)\1/i.exec(m[0])?.[2] ?? "";
    const alt = /\balt=(["'])(.*?)\1/i.exec(m[0])?.[2] ?? "";
    res.push({ src, alt });
  }
  return res;
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
