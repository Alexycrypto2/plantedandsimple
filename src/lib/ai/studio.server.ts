import { generateImageBase64 } from "./gateway.server";

/** One consistent photography brief so every image in an article matches. */
export const PHOTO_STYLE =
  "Shot on a Canon R5 with an 85mm f/1.4 lens: ultra-realistic professional food photography, magazine editorial quality, soft directional window light with gentle falloff, shallow depth of field, real crumbs, steam and imperfect edges, matte linen, ceramic and warm cream surfaces, muted olive and warm beige palette, natural soft shadows, styled by a food stylist for a premium cookbook. The food must be exactly the dish described — correct ingredients, colours and portion size. Absolutely no text, no lettering, no captions, no logos, no watermarks, no borders, no collage, no split frames, no illustration, no 3D render, no CGI or plastic-looking food, no extra hands or distorted cutlery, no oversaturated colours.";

export const PIN_STYLES = [
  "Minimal Editorial",
  "Food Magazine",
  "Recipe Card",
  "Lifestyle",
  "Clean White",
  "Bold Colors",
  "Organic Food",
  "Luxury",
] as const;
export type PinStyle = (typeof PIN_STYLES)[number];

export type RenderedImage = { url: string | null; path: string; prompt: string };

/** Generates one image and stores it privately, returning a long-lived signed URL. */
export async function renderImage(
  prompt: string,
  folder: string,
  framing = "3:2 landscape composition, subject centered",
): Promise<RenderedImage> {
  const full = `${prompt}. ${framing}. ${PHOTO_STYLE}`;
  const { base64, mime } = await generateImageBase64(full);
  const ext = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.storage
    .from("ai-images")
    .upload(path, Buffer.from(base64, "base64"), { contentType: mime, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = await supabaseAdmin.storage.from("ai-images").createSignedUrl(path, 60 * 60 * 24 * 365);
  return { url: data?.signedUrl ?? null, path, prompt: full };
}

/** Never let one failed render kill a whole generation run. */
export async function renderImageSafe(
  prompt: string,
  folder: string,
  framing?: string,
): Promise<RenderedImage | null> {
  try {
    return await renderImage(prompt, folder, framing);
  } catch {
    return null;
  }
}

export const FRAMING = {
  hero: "wide 1.9:1 landscape hero composition, generous negative space, safe social crop",
  section: "3:2 landscape composition, close editorial crop",
  flatlay: "overhead 4:5 flat-lay of raw ingredients arranged with intention",
  step: "45-degree angle close-up of a single cooking step, hands optional",
  finished: "45-degree hero angle of the finished plated dish",
  pin: "vertical 2:3 Pinterest composition (1000x1500), tall frame, clean empty space at the top third for a text overlay",
  social: "1.91:1 landscape social sharing composition, subject center-left",
} as const;

export function requireBossFactory() {
  return async function requireBoss(supabase: any, userId: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!(data ?? []).some((r: any) => r.role === "boss")) throw new Error("Forbidden");
  };
}

/** Builds the final editorial HTML from generated sections + rendered images. */
export function assembleArticleHtml(opts: {
  intro: string;
  toc: boolean;
  takeaways?: string[] | null;
  sections: Array<{
    heading: string;
    html: string;
    callout?: string | null;
    pullquote?: string | null;
    imageUrl?: string | null;
    imageAlt?: string;
    imageCaption?: string | null;
  }>;
  recipe?: {
    name: string;
    prep_time: string;
    cook_time: string;
    servings: string;
    ingredients: string[];
    steps: string[];
    nutrition: Array<{ label: string; value: string }>;
    tips: string[];
    heroImageUrl?: string | null;
    ingredientsImageUrl?: string | null;
  } | null;
  faqs?: Array<{ q: string; a: string }>;
  productHtml?: string | null;
  conclusion: string;
  cta?: string | null;
}) {
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const esc = (s: string) => s.replace(/"/g, "&quot;");
  const figure = (url: string, alt: string, caption?: string | null) =>
    `<figure class="article-figure"><img src="${url}" alt="${esc(alt)}" loading="lazy" decoding="async" />` +
    (caption ? `<figcaption>${caption}</figcaption>` : "") +
    `</figure>`;

  const parts: string[] = [];
  parts.push(`<div class="article-lead">${opts.intro}</div>`);

  if (opts.takeaways?.length) {
    parts.push(
      `<aside class="article-takeaways"><h2>What you'll learn</h2><ul>${opts.takeaways
        .map((t) => `<li>${t}</li>`)
        .join("")}</ul></aside>`,
    );
  }

  if (opts.toc && opts.sections.length > 2) {
    parts.push(
      `<nav class="article-toc" aria-label="Table of contents"><p class="article-toc-title">In this article</p><ol>${opts.sections
        .map((s) => `<li><a href="#${slugify(s.heading)}">${s.heading}</a></li>`)
        .join("")}</ol></nav>`,
    );
  }

  for (const s of opts.sections) {
    parts.push(`<section class="article-section"><h2 id="${slugify(s.heading)}">${s.heading}</h2>`);
    parts.push(s.html);
    if (s.imageUrl) parts.push(figure(s.imageUrl, s.imageAlt ?? s.heading, s.imageCaption ?? null));
    if (s.pullquote) parts.push(`<blockquote class="article-quote">${s.pullquote}</blockquote>`);
    if (s.callout) parts.push(`<aside class="article-callout"><span>Tip</span><p>${s.callout}</p></aside>`);
    parts.push(`</section>`);
  }

  if (opts.recipe) {
    const r = opts.recipe;
    parts.push(
      `<section class="recipe-card"><h2 id="recipe">${r.name}</h2>` +
        (r.heroImageUrl ? figure(r.heroImageUrl, r.name, "The finished dish") : "") +
        `<div class="recipe-meta"><span><strong>Prep</strong>${r.prep_time}</span><span><strong>Cook</strong>${r.cook_time}</span><span><strong>Serves</strong>${r.servings}</span></div>` +
        `<div class="recipe-grid"><div><h3>Ingredients</h3><ul class="recipe-ingredients">${r.ingredients
          .map((i) => `<li>${i}</li>`)
          .join("")}</ul>` +
        (r.ingredientsImageUrl ? figure(r.ingredientsImageUrl, `${r.name} ingredients`, "Everything you need") : "") +
        `</div><div><h3>Method</h3><ol class="recipe-steps">${r.steps.map((i) => `<li>${i}</li>`).join("")}</ol></div></div>` +
        (r.nutrition?.length
          ? `<h3>Nutrition (per serving)</h3><ul class="recipe-nutrition">${r.nutrition
              .map((n) => `<li><span>${n.label}</span><strong>${n.value}</strong></li>`)
              .join("")}</ul>`
          : "") +
        (r.tips?.length
          ? `<h3>Cook's notes</h3><ul class="recipe-tips">${r.tips.map((t) => `<li>${t}</li>`).join("")}</ul>`
          : "") +
        `</section>`,
    );
  }

  if (opts.faqs?.length) {
    parts.push(
      `<section class="article-faq"><h2 id="faq">Frequently asked questions</h2>${opts.faqs
        .map((f) => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`)
        .join("")}</section>`,
    );
  }

  if (opts.productHtml) parts.push(`<aside class="article-product">${opts.productHtml}</aside>`);
  parts.push(`<section class="article-section"><h2 id="conclusion">Final thoughts</h2>${opts.conclusion}</section>`);
  if (opts.cta) parts.push(`<aside class="article-cta"><p>${opts.cta}</p></aside>`);
  return parts.join("\n");
}
