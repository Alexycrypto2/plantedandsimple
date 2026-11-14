import { DAYS, DAY_LABEL, SLOTS, type PlanSlots } from "../data/types";
import { RECIPE_BY_ID } from "../data/content";
import { buildPrepPlan } from "../lib/prep";

export function FridgeSheet({ slots, servings }: { slots: PlanSlots; servings: number }) {
  const prep = buildPrepPlan(slots, servings);
  return <div className="fridge-sheet text-foreground">
    <h1 className="font-display text-2xl text-primary">Planted & Simple · This week</h1>
    <p className="mb-4 text-sm">{servings} serving(s) per meal · Nutrition estimates per person</p>
    <table className="w-full table-fixed border-collapse text-xs"><thead><tr><th className="w-16 border p-2 text-left">Day</th>{SLOTS.map((s) => <th key={s} className="border p-2 text-left capitalize">{s}</th>)}</tr></thead>
      <tbody>{DAYS.map((d) => <tr key={d}><th className="border p-2 text-left">{DAY_LABEL[d]}</th>{SLOTS.map((s) => { const id = slots[d]?.[s]; return <td key={s} className="border p-2 align-top">{id ? RECIPE_BY_ID[id]?.title ?? "—" : "—"}</td>; })}</tr>)}</tbody></table>
    <h2 className="mt-4 font-semibold text-primary">Prep checklist</h2>
    <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">{prep.tasks.map((t) => <li key={t.id}>□ {t.title}</li>)}</ul>
    <h2 className="mt-4 font-semibold text-primary">Store safely</h2>
    <p className="mt-1 text-xs">Refrigerate promptly within 2 hours at 4°C / 40°F or below. Follow each recipe’s storage instructions. Freeze suitable later-week portions; otherwise prep a fresh batch midweek.</p>
  </div>;
}