import { DAYS, SLOTS, type PlanSlots, type Recipe } from "../data/types";

export type WeekPreferences = { dislikes: string[]; allergies: string[]; pantry: string[]; note?: string; goal?: string; proteinTarget?: number };
export function buildSmartWeek(recipes: Recipe[], prefs: WeekPreferences): { slots: PlanSlots; reason: string } {
  const avoid = [...prefs.dislikes, ...prefs.allergies].map((s) => s.toLowerCase().trim()).filter(Boolean);
  const text = (r: Recipe) => `${r.title} ${r.ingredients.join(" ")} ${r.proteins.join(" ")}`.toLowerCase();
  const safe = recipes.filter((r) => !avoid.some((a) => text(r).includes(a)));
  if (!safe.length) throw new Error("No recipes match these exclusions. Review your preferences before planning.");
  const target = prefs.proteinTarget || 100;
  const quick = /quick|fast|25|busy/i.test(prefs.note ?? "");
  const slots: PlanSlots = {};
  const uses = new Map<string, number>();
  const candidates = (slot: string) => {
    const list = safe.filter((r) => r.category === slot || ((slot === "lunch" || slot === "dinner") && r.category === "meal-prep"));
    return list.length ? list : safe;
  };
  for (const day of DAYS) {
    const picked: Recipe[] = [];
    slots[day] = {};
    for (const slot of SLOTS) {
      const rank = (r: Recipe) => prefs.pantry.filter((p) => p.trim() && text(r).includes(p.toLowerCase().trim())).length * 3
        - (uses.get(r.id) ?? 0) * 2 - (picked.some((p) => p.id === r.id) ? 12 : 0)
        + (quick ? (r.totalMinutes <= 25 ? 5 : -5) : 0);
      const r = [...candidates(slot)].sort((a, b) => rank(b) - rank(a) || a.id.localeCompare(b.id))[0];
      if (r) picked.push(r);
    }
    // Coordinate all four meals, rather than ranking each meal's protein independently.
    let total = picked.reduce((n, r) => n + r.nutrition.protein, 0);
    for (let round = 0; round < 4 && total < target; round++) {
      let best: { index: number; recipe: Recipe; gain: number } | null = null;
      picked.forEach((current, index) => {
        for (const recipe of candidates(SLOTS[index] ?? "dinner")) {
          if (picked.some((p, i) => i !== index && p.id === recipe.id)) continue;
          if (quick && recipe.totalMinutes > 25 && current.totalMinutes <= 25) continue;
          const gain = recipe.nutrition.protein - current.nutrition.protein;
          if (gain > 0 && (!best || gain > best.gain)) best = { index, recipe, gain };
        }
      });
      const upgrade = best as { index: number; recipe: Recipe; gain: number } | null;
      if (!upgrade) break;
      picked[upgrade.index] = upgrade.recipe;
      total += upgrade.gain;
    }
    picked.forEach((r, i) => { const slot = SLOTS[i]; if (slot) slots[day] = { ...slots[day], [slot]: r.id }; uses.set(r.id, (uses.get(r.id) ?? 0) + 1); });
  }
  const totals = DAYS.map((d) => SLOTS.reduce((n, s) => n + (recipes.find((r) => r.id === slots[d]?.[s])?.nutrition.protein ?? 0), 0));
  const below = totals.filter((n) => n < target).length;
  return { slots, reason: `Your seven-day week is ready. Estimated protein: ${Math.round(totals.reduce((a, b) => a + b, 0) / 7)}g/day against your ${target}g target.${below ? ` ${below} day(s) fall below the target; swap meals or adjust portions.` : ""}` };
}