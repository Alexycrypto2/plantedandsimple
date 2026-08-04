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
  sections: Array<{ heading: string; html: string; callout?: string | null; imageUrl?: string | null; imageAlt?: string }>;
  recipe?: {
    name: string;
    prep_time: string;
    cook_time: string;
    servings: string;
    ingredients: string[];
    steps: string[];
    nutrition: Array<{ label: string; value: string }>;
    tips: string[];
  } | null;
  faqs?: Array<{ q: string; a: string }>;
  productHtml?: string | null;
  conclusion: string;
  cta?: string | null;
}) {
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const parts: string[] = [];
  parts.push(`<p class="lead">${opts.intro}</p>`);
  if (opts.toc && opts.sections.length > 1) {
    parts.push(
      `<nav class="toc"><h2>Table of contents</h2><ol>${opts.sections
        .map((s) => `<li><a href="#${slugify(s.heading)}">${s.heading}</a></li>`)
        .join("")}</ol></nav>`,
    );
  }
  for (const s of opts.sections) {
    parts.push(`<h2 id="${slugify(s.heading)}">${s.heading}</h2>`);
    if (s.imageUrl) {
      parts.push(
        `<figure><img src="${s.imageUrl}" alt="${(s.imageAlt ?? s.heading).replace(/"/g, "'")}" loading="lazy" /><figcaption>${s.heading}</figcaption></figure>`,
      );
    }
    parts.push(s.html);
    if (s.callout) parts.push(`<aside class="callout"><p>${s.callout}</p></aside>`);
  }
  if (opts.recipe) {
    const r = opts.recipe;
    parts.push(
      `<section class="recipe-card"><h2 id="recipe">${r.name}</h2>` +
        `<p class="recipe-meta"><strong>Prep</strong> ${r.prep_time} · <strong>Cook</strong> ${r.cook_time} · <strong>Serves</strong> ${r.servings}</p>` +
        `<h3>Ingredients</h3><ul>${r.ingredients.map((i) => `<li>${i}</li>`).join("")}</ul>` +
        `<h3>Method</h3><ol>${r.steps.map((i) => `<li>${i}</li>`).join("")}</ol>` +
        (r.nutrition?.length
          ? `<h3>Nutrition (per serving)</h3><ul class="nutrition">${r.nutrition.map((n) => `<li><strong>${n.label}</strong> ${n.value}</li>`).join("")}</ul>`
          : "") +
        (r.tips?.length ? `<h3>Cooking tips</h3><ul>${r.tips.map((t) => `<li>${t}</li>`).join("")}</ul>` : "") +
        `</section>`,
    );
  }
  if (opts.faqs?.length) {
    parts.push(
      `<section class="faq"><h2 id="faq">Frequently asked questions</h2>${opts.faqs
        .map((f) => `<h3>${f.q}</h3><p>${f.a}</p>`)
        .join("")}</section>`,
    );
  }
  if (opts.productHtml) parts.push(opts.productHtml);
  parts.push(`<h2 id="conclusion">Final thoughts</h2>${opts.conclusion}`);
  if (opts.cta) parts.push(`<aside class="cta"><p>${opts.cta}</p></aside>`);
  return parts.join("\n");
}
