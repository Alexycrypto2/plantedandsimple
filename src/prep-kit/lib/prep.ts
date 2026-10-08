import { RECIPE_BY_ID } from "@/prep-kit/data/content";
import { DAYS, SLOTS, type PlanSlots, type Recipe } from "@/prep-kit/data/types";
import { planRecipeCounts, splitIngredient } from "./grocery";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type StationId = "setup" | "passive" | "board" | "stove" | "finish";

export const STATIONS: { id: StationId; label: string; blurb: string }[] = [
  { id: "setup", label: "Set up", blurb: "Clear the counter, heat the oven, line up containers." },
  { id: "passive", label: "Hands-off cooking", blurb: "Start what cooks on its own first — it runs while you work." },
  { id: "board", label: "Board & knife", blurb: "All washing and chopping in one sitting." },
  { id: "stove", label: "Proteins & sauces", blurb: "Active stove work, dressings and sauces." },
  { id: "finish", label: "Cool, portion & store", blurb: "Portion, label, refrigerate and freeze." },
];

export interface PrepTask {
  id: string;
  station: StationId;
  title: string;
  detail: string;
  /** Combined batch amounts, e.g. "1 cup quinoa ×2" */
  amounts: string[];
  recipes: string[];
  active: number;
  passive: number;
  /** Minutes from the start of prep (timeline mode) */
  start?: number;
}

export interface Batch { recipe: Recipe; meals: number; batches: number; days: number[] }

export interface StorageItem { recipe: string; where: "fridge" | "freezer"; eatBy: string; note?: string | undefined }

export interface PrepPlan {
  tasks: PrepTask[];
  batches: Batch[];
  shared: { name: string; recipes: string[] }[];
  storage: StorageItem[];
  stats: { totalMinutes: number; activeMinutes: number; containers: number; meals: number; batchesSaved: number };
  equipment: string[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const lc = (s: string) => s.toLowerCase();
const has = (r: Recipe, words: string[]) => r.ingredients.some((i) => words.some((w) => lc(i).includes(w)));
const stepsHave = (r: Recipe, words: string[]) => r.steps.some((s) => words.some((w) => lc(s).includes(w)));
const mins = (s: string) => {
  const h = s.match(/(\d+)\s*h/i);
  const m = s.match(/(\d+)\s*m/i);
  const n = (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  return n || Number(s.match(/\d+/)?.[0] ?? 0);
};

/** Combined amount lines for every ingredient matching `words`, multiplied by batches. */
function amountsFor(batches: Batch[], words: string[]): string[] {
  const out = new Map<string, { qty: string; n: number }[]>();
  for (const b of batches) {
    for (const line of b.recipe.ingredients) {
      if (!words.some((w) => lc(line).includes(w))) continue;
      const { qty, name } = splitIngredient(line);
      const key = lc(name);
      const arr = out.get(key) ?? [];
      arr.push({ qty, n: b.batches });
      out.set(key, arr);
    }
  }
  return [...out.entries()].slice(0, 6).map(([name, parts]) => {
    const q = parts.map((p) => (p.qty ? `${p.qty}${p.n > 1 ? ` ×${p.n}` : ""}` : p.n > 1 ? `×${p.n}` : "")).filter(Boolean).join(" + ");
    return q ? `${q} ${name}` : name;
  });
}

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

export function buildPrepPlan(slots: PlanSlots, servings = 1): PrepPlan {
  const counts = planRecipeCounts(slots);
  const days = new Map<string, number[]>();
  DAYS.forEach((d, i) => SLOTS.forEach((s) => {
    const id = slots[d]?.[s];
    if (id) days.set(id, [...(days.get(id) ?? []), i]);
  }));

  const batches: Batch[] = [...counts.entries()]
    .map(([id, meals]) => {
      const recipe = RECIPE_BY_ID[id];
      if (!recipe) return null;
      const serves = Number(recipe.serves.match(/\d+/)?.[0] ?? 1) || 1;
      return { recipe, meals, batches: Math.max(1, Math.ceil((meals * servings) / serves)), days: days.get(id) ?? [] };
    })
    .filter((b): b is Batch => !!b);

  const recipes = batches.map((b) => b.recipe);
  const pick = (f: (r: Recipe) => boolean) => batches.filter((b) => f(b.recipe));
  const titles = (bs: Batch[]) => bs.map((b) => b.recipe.title);
  const tasks: PrepTask[] = [];

  const oven = pick((r) => stepsHave(r, ["oven", "bake", "roast"]));
  const grains = pick((r) => has(r, ["rice", "quinoa", "farro", "oats"]));
  const lentils = pick((r) => has(r, ["lentil"]));
  const tofu = pick((r) => has(r, ["tofu"]));
  const tempeh = pick((r) => has(r, ["tempeh"]));
  const veg = pick((r) => has(r, ["onion", "pepper", "carrot", "cucumber", "broccoli", "garlic", "zucchini", "kale", "spinach"]));
  const sauces = pick((r) => has(r, ["tahini", "dressing", "sauce", "vinegar", "lemon juice", "lime juice"]));
  const freezer = pick((r) => r.freezer);

  // Setup
  tasks.push({ id: "setup", station: "setup", title: oven.length ? "Preheat the oven & set up" : "Set up your station",
    detail: `${oven.length ? "Heat the oven per the first roasting recipe. " : ""}Clear the counter, get out a cutting board, sheet pans and containers.`,
    amounts: [], recipes: titles(oven), active: 5, passive: 0 });
  if (tofu.length) tasks.push({ id: "press-tofu", station: "setup", title: "Press all the tofu", detail: "Wrap every block in a towel under something heavy. It presses while you start other tasks.",
    amounts: amountsFor(tofu, ["tofu"]), recipes: titles(tofu), active: 2, passive: 20 });

  // Passive
  if (grains.length) tasks.push({ id: "grains", station: "passive", title: "Cook one big pot of grains", detail: "Cook all grains for the week together. Leave them slightly firm so they reheat well.",
    amounts: amountsFor(grains, ["rice", "quinoa", "farro", "oats"]), recipes: titles(grains), active: 5, passive: 20 });
  if (lentils.length) tasks.push({ id: "lentils", station: "passive", title: "Start the lentils simmering", detail: "Rinse, cover with water or broth and simmer gently. Stir now and then.",
    amounts: amountsFor(lentils, ["lentil"]), recipes: titles(lentils), active: 5, passive: 25 });
  const longCooks = batches.filter((b) => (b.recipe.mealPrep || b.recipe.freezer) && mins(b.recipe.cook) >= 25).sort((a, b) => mins(b.recipe.cook) - mins(a.recipe.cook));
  for (const b of longCooks) tasks.push({ id: `cook-${b.recipe.id}`, station: "passive", title: `${b.recipe.title}${b.batches > 1 ? ` ×${b.batches}` : ""}`,
    detail: `Assemble and let it cook. ${b.recipe.storage.fridge ?? ""}`.trim(), amounts: [], recipes: [b.recipe.title], active: mins(b.recipe.prep), passive: mins(b.recipe.cook) });

  // Board
  if (veg.length) tasks.push({ id: "chop", station: "board", title: "Wash & chop all vegetables", detail: "Wash produce first, then dice onions, peppers and crunchy veg in one go. Store in glass containers.",
    amounts: amountsFor(veg, ["onion", "pepper", "carrot", "cucumber", "broccoli", "garlic", "zucchini", "kale", "spinach"]), recipes: titles(veg), active: 20, passive: 0 });

  // Stove
  if (tofu.length) tasks.push({ id: "cook-tofu", station: "stove", title: "Cook the tofu", detail: "Cube or crumble the pressed tofu and cook following each recipe — season per recipe in the final minutes.",
    amounts: [], recipes: titles(tofu), active: 15, passive: 0 });
  if (tempeh.length) tasks.push({ id: "tempeh", station: "stove", title: "Prepare the tempeh", detail: "Slice or crumble, then cook as each recipe directs.", amounts: amountsFor(tempeh, ["tempeh"]), recipes: titles(tempeh), active: 12, passive: 0 });
  const quick = batches.filter((b) => !longCooks.includes(b) && (b.recipe.mealPrep || b.recipe.freezer));
  for (const b of quick) tasks.push({ id: `cook-${b.recipe.id}`, station: "stove", title: `${b.recipe.title}${b.batches > 1 ? ` ×${b.batches}` : ""}`,
    detail: `${b.recipe.prep} prep · ${b.recipe.cook} cook.`, amounts: [], recipes: [b.recipe.title], active: mins(b.recipe.prep) + mins(b.recipe.cook), passive: 0 });
  if (sauces.length) tasks.push({ id: "sauces", station: "stove", title: "Whisk dressings & sauces", detail: "Make every dressing now and store in small jars — add to meals on the day.",
    amounts: amountsFor(sauces, ["tahini", "dressing", "sauce"]), recipes: titles(sauces), active: 10, passive: 0 });

  // Finish
  tasks.push({ id: "portion", station: "finish", title: "Cool, portion & label", detail: "Let food cool, then portion into containers. Label with name and date. Dressings at the bottom of jars, greens on top.",
    amounts: [], recipes: [], active: 15, passive: 0 });
  if (freezer.length) tasks.push({ id: "freeze", station: "finish", title: "Freeze later-in-week portions", detail: "Freeze anything you'll eat from Thursday on. Cool fully and freeze flat.",
    amounts: [], recipes: titles(freezer), active: 5, passive: 0 });

  // Timeline: active work is sequential, passive runs alongside.
  const order: StationId[] = ["setup", "passive", "board", "stove", "finish"];
  tasks.sort((a, b) => order.indexOf(a.station) - order.indexOf(b.station));
  let cursor = 0;
  let end = 0;
  for (const t of tasks) {
    t.start = cursor;
    cursor += t.active;
    end = Math.max(end, cursor + t.passive);
  }
  const activeMinutes = tasks.reduce((s, t) => s + t.active, 0);

  // Storage roadmap
  const storage: StorageItem[] = batches.map((b) => {
    const late = b.days.some((d) => d >= 3);
    const where = late && b.recipe.freezer ? "freezer" : "fridge";
    const last = Math.max(...(b.days.length ? b.days : [0]));
    return { recipe: b.recipe.title, where, eatBy: where === "freezer" ? "Thaw the night before" : `By ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][last]}`,
      note: where === "freezer" ? b.recipe.storage.freezer : b.recipe.storage.fridge };
  });

  const meals = batches.reduce((s, b) => s + b.meals, 0);
  const equipment = [
    `${meals * servings} meal containers`,
    sauces.length ? `${sauces.length} small jars for dressings` : "",
    oven.length ? "2 sheet pans + parchment" : "",
    grains.length || lentils.length ? "Large pot" : "",
    tofu.length ? "Clean towel + heavy pan for pressing" : "",
    freezer.length ? "Freezer bags + marker" : "",
  ].filter(Boolean);

  return {
    tasks, batches, shared: sharedComponents(slots), storage, equipment,
    stats: { totalMinutes: Math.max(end, cursor), activeMinutes, containers: meals * servings, meals,
      batchesSaved: Math.max(0, meals - batches.length) },
  };
}

/** Legacy flat list (used by dashboard etc.) */
export function buildPrep(slots: PlanSlots) {
  return buildPrepPlan(slots).tasks.map((t) => ({ ...t, phase: STATIONS.find((s) => s.id === t.station)!.label, minutes: t.active + t.passive }));
}

/** Components shared across several recipes — "prep once, use many times". */
export function sharedComponents(slots: PlanSlots) {
  const recipes = [...planRecipeCounts(slots).keys()].map((id) => RECIPE_BY_ID[id]).filter((r): r is Recipe => !!r);
  const comps: [string, string[]][] = [
    ["Tofu", ["tofu"]], ["Tempeh", ["tempeh"]], ["Chickpeas", ["chickpea"]], ["Lentils", ["lentil"]],
    ["Rice", ["rice"]], ["Quinoa", ["quinoa"]], ["Black beans", ["black bean"]], ["Tahini dressing", ["tahini"]],
  ];
  return comps
    .map(([name, words]) => ({ name, recipes: recipes.filter((r) => has(r, words)).map((r) => r.title) }))
    .filter((c) => c.recipes.length > 1);
}
