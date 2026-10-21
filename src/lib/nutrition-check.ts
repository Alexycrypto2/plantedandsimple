// Atwater energy check: calories should equal protein*4 + carbs*4 + fat*9.
// When the AI's calorie figure drifts more than 10% from its own macros,
// the calories are recomputed from the macros so the label stays consistent.

type Row = { label: string; value: string };

function grams(rows: Row[], key: RegExp): number | null {
  const r = rows.find((n) => key.test(n.label));
  if (!r) return null;
  const m = String(r.value).match(/[\d.]+/);
  return m ? Number(m[0]) : null;
}

export function fixCalories(rows: Row[]): Row[] {
  const p = grams(rows, /^protein/i);
  const c = grams(rows, /^carb/i);
  const f = grams(rows, /^fat/i);
  const kcal = grams(rows, /^calorie|^energy/i);
  if (p == null || c == null || f == null) return rows;
  const expected = Math.round(p * 4 + c * 4 + f * 9);
  if (kcal != null && Math.abs(kcal - expected) <= expected * 0.1) return rows;
  const has = rows.some((n) => /^calorie|^energy/i.test(n.label));
  const fixed = rows.map((n) => (/^calorie|^energy/i.test(n.label) ? { ...n, value: `${expected} kcal` } : n));
  return has ? fixed : [{ label: "Calories", value: `${expected} kcal` }, ...fixed];
}
