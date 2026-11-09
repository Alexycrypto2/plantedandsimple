/** The five vegan-niche article formats. Browser-safe: used by Blog Studio and the writer prompt. */
export type BlogFormatId = "hero_recipe" | "roundup" | "how_to" | "meal_prep" | "nutrition_guide";

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

export const BLOG_FORMAT_LIST = Object.values(BLOG_FORMATS);

/** Picks the format a title most likely needs. Order matters: specific signals first. */
export function detectBlogFormat(title: string): BlogFormatId {
  const t = ` ${title.toLowerCase()} `;
  if (/\b(meal[- ]?prep|batch[- ]?cook|sunday prep|weekly (plan|menu)|prep for the week|lunch(es)? for the week)\b/.test(t)) return "meal_prep";
  if (/^\s*\d+\s|\b(best|top|roundup|collection|ideas)\b/.test(t)) return "roundup";
  if (/\b(how to|how do|guide to (cook|press|make)|technique|mistakes|tips for|without (it|them))\b/.test(t)) return "how_to";
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
