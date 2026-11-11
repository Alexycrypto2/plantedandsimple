/** The five vegan-niche article formats. Browser-safe: used by Blog Studio and the writer prompt. */
export type BlogFormatId = "hero_recipe" | "roundup" | "how_to" | "meal_prep" | "nutrition_guide" | "holiday_menu";

export type BlogFormat = {
  id: BlogFormatId;
  label: string;
  /** Section photos allowed on top of hero / recipe / Pinterest shots. */
  sectionPhotos: number;
  includeRecipe: boolean;
  structure: string;
  photos: string;
};

export const BLOG_FORMATS: Record<BlogFormatId, BlogFormat> = {
  hero_recipe: {
    id: "hero_recipe", label: "Hero recipe", sectionPhotos: 3, includeRecipe: true,
    structure: `1. Two-sentence sensory hook: texture, flavour and total time; say the full recipe card is below.
2. "Why this works": 3 short bullets naming the actual technique tricks.
3. Ingredients and swaps: what each key ingredient does, with gluten-free / nut-free / soy-free swaps.
4. Step-by-step method: one section per stage, each telling the cook what it should look, sound or smell like.
5. Storage, reheating and meal-prep notes.
6. Serving ideas.`,
    photos: "the cooking stages the method describes (e.g. tofu browning in a cast-iron pan, sauce thickening), plus a close-up texture shot of the finished dish",
  },
  roundup: {
    id: "roundup", label: "Recipe roundup", sectionPhotos: 6, includeRecipe: false,
    structure: `1. Short intro naming the reader's real problem (busy weeknights, hitting protein, cold weather).
2. One section per dish: heading = dish name; 2-3 sentences on why it earns its place, total time and approximate protein per serving written as "about Xg".
3. A short "how to plan the week from this list" section.
Never invent links. Each dish must be different in protein source or cooking method.`,
    photos: "one finished-dish photo per listed recipe, each visibly different in colour, bowl and angle",
  },
  how_to: {
    id: "how_to", label: "Kitchen how-to", sectionPhotos: 4, includeRecipe: false,
    structure: `1. The problem and the one-line fix, answered in the first paragraph.
2. Equipment that matters (and what does not).
3. The technique, step by step, with timings and visual cues.
4. "Mistakes that ruin it" section as a list.
5. Three flavour variations.`,
    photos: "hands-off close-ups of the technique in progress and a before/after comparison of the result",
  },
  meal_prep: {
    id: "meal_prep", label: "Meal prep plan", sectionPhotos: 4, includeRecipe: false,
    structure: `1. What the plan gives the reader (number of meals, days, protein) and the total hands-on time.
2. Grocery list grouped by store section.
3. A timed prep schedule (e.g. 0:00 grains on, 0:10 roast vegetables).
4. One section per meal/container.
5. Storage, food-safety and reheating rules, with day limits.`,
    photos: "glass meal-prep containers lined up on a counter, individual portioned containers, a sauce jar close-up",
  },
  nutrition_guide: {
    id: "nutrition_guide", label: "Nutrition guide", sectionPhotos: 2, includeRecipe: false,
    structure: `1. Direct answer in the first paragraph.
2. A comparison list of whole foods with approximate amounts per normal serving (use widely published USDA-style values, written as approximate; never invent studies or statistics).
3. A realistic sample day of eating.
4. Pantry staples checklist.
5. Honest limits: when to talk to a dietitian.
No medical claims.`,
    photos: "a whole-food ingredient lineup (tempeh, lentils, edamame, hemp seeds) and real plated meals",
  },
};

BLOG_FORMATS.holiday_menu = {
  id: "holiday_menu", label: "Holiday menu & timeline", sectionPhotos: 5, includeRecipe: false,
  structure: `1. The menu at a glance: mains, sides, sauce and dessert, with how many people it serves.
2. One section per course or dish: heading = dish name; why it belongs on the table, protein per serving as "about Xg", what can be made ahead.
3. A make-ahead timeline (2 days before, 1 day before, morning of, last hour) as an ordered list.
4. Oven and stovetop plan: what cooks when, at which temperature, so nothing fights for space.
5. Leftovers and storage.
Cover EVERY part the title names (e.g. mains AND sides AND timeline).`,
  photos: "the full set table, individual dishes from the menu, and one make-ahead prep shot",
};

export const BLOG_FORMAT_LIST = Object.values(BLOG_FORMATS);

/** Picks the format a title most likely needs. Order matters: specific signals first. */
export function detectBlogFormat(title: string): BlogFormatId {
  const t = ` ${title.toLowerCase()} `;
  if (/\b(menu|timeline|make[- ]ahead plan|dinner party|entertaining|game plan)\b/.test(t) && !/^\s*\d+\s/.test(t)) return "holiday_menu";
  if (/\b(meal[- ]?prep|batch[- ]?cook|sunday prep|weekly (plan|menu)|prep for the week|lunch(es)? for the week)\b/.test(t)) return "meal_prep";
  if (/^\s*\d+\s|\b(best|top|roundup|collection|ideas)\b/.test(t)) return "roundup";
  if (/\b(enough protein|protein on a|plant-based diet|vegan diet|supplements|nutrients?|nutrition|b12|iron|calcium|grocery|shopping|on a budget)\b/.test(t)) return "nutrition_guide";
  if (/\b(how to|how do|guide to (cook|press|make)|technique|mistakes|tips for|without (it|them))\b/.test(t)) return "how_to";
  if (/\b(chili|soup|stew|curry|skillet|bowl|bowls|tacos|noodles|pasta|salad|loaf|burger|seeds|dahl|dal|stir[- ]?fry|bake|traybake|scramble|wrap|sandwich|pancakes|oats|smoothie|cookies|cake|bars)\b/.test(t)) return "hero_recipe";
  if (/\b(protein|nutrition|nutrients|budget|grocery|shopping|beginner|b12|iron|calcium|healthy|vs\.?|is .* healthy)\b/.test(t)) return "nutrition_guide";
  return "hero_recipe";
}

/** AI-sounding words and phrases the writer must never use. */
export const BANNED_PHRASES = [
  "delve", "elevate", "unlock", "game-changer", "game changer", "embark", "testament to", "tapestry", "beacon",
  "nestled", "look no further", "whether you're", "in today's", "fast-paced", "bursting with flavor", "burst of flavour",
  "tantalizing", "tantalising", "bustling", "robust", "moreover", "furthermore", "in conclusion", "dive into",
  "in the world of", "when it comes to", "culinary journey", "symphony of", "mouthwatering", "take it to the next level",
  "a feast for the senses", "guilt-free", "superfood", "revolutionize", "seamlessly", "navigate",
];

export function findBannedPhrases(text: string): string[] {
  const low = text.toLowerCase();
  return BANNED_PHRASES.filter((p) => low.includes(p));
}

/** The number of items a title promises ("12 Easy Ideas" -> 12), or null. */
export function titleItemCount(title: string): number | null {
  const m = title.match(/(?:^|[\s:(—-])(\d{1,2})\s+(?:[a-z-]+\s+){0,8}?(ideas|recipes|dishes|dinners|sides|meals|ways|snacks|lunches|breakfasts|desserts|bowls|soups|salads|tips|swaps|foods)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 3 && n <= 40 ? n : null;
}

const SWAPS: Record<string, string> = {
  delve: "dig", elevate: "lift", unlock: "get", "game-changer": "big help", "game changer": "big help",
  embark: "start", nestled: "tucked", "look no further": "start here", tantalizing: "inviting",
  tantalising: "inviting", bustling: "busy", robust: "hearty", moreover: "also", furthermore: "also",
  "in conclusion": "to wrap up", "dive into": "get into", mouthwatering: "craveable", "guilt-free": "light",
  superfood: "nutrient-dense food", seamlessly: "smoothly", "bursting with flavor": "full of flavor",
  "burst of flavour": "hit of flavour", "culinary journey": "cooking", "take it to the next level": "make it better",
};

/** Swaps AI-cliche words for plain ones, keeping capitalisation of the first letter. */
export function sanitizeBanned(text: string): string {
  let out = text;
  for (const [bad, good] of Object.entries(SWAPS)) {
    out = out.replace(new RegExp(`\\b${bad.replace(/[-]/g, "[- ]")}(s|d|ing)?\\b`, "gi"), (w) => {
      const r = good;
      return w[0] === w[0].toUpperCase() ? r[0].toUpperCase() + r.slice(1) : r;
    });
  }
  return out;
}
