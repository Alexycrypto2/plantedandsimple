import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RECIPES } from "@/data/recipes";
import { RECIPE_BY_ID } from "@/data/content";
import type { Recipe, Slot } from "@/data/types";

/** Similar recipes for a swap: same meal type first, then shared protein sources. */
export function swapSuggestions(currentId: string | null | undefined, slot: Slot, avoid: string[] = []): Recipe[] {
  const cur = currentId ? RECIPE_BY_ID[currentId] : undefined;
  const avoidL = avoid.map((a) => a.toLowerCase()).filter(Boolean);
  return RECIPES.filter((r) => r.id !== currentId)
    .filter((r) => !avoidL.some((a) => r.ingredients.join(" ").toLowerCase().includes(a)))
    .map((r) => {
      let score = 0;
      const fits = slot === "snack" ? r.category === "snack" : slot === "breakfast" ? r.category === "breakfast" : ["lunch", "dinner", "meal-prep"].includes(r.category);
      if (fits) score += 10;
      if (cur) score += r.proteins.filter((p) => cur.proteins.includes(p)).length * 2;
      if (cur && Math.abs(r.nutrition.protein - cur.nutrition.protein) < 6) score += 1;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.r);
}

export function RecipePicker({
  open, onOpenChange, slot, currentId, avoid, onPick,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; slot: Slot; currentId?: string | null | undefined; avoid?: string[] | undefined;
  onPick: (id: string | null) => void;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = swapSuggestions(currentId, slot, avoid);
    return q ? s.filter((r) => r.title.toLowerCase().includes(q.toLowerCase())) : s;
  }, [q, currentId, slot, avoid]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">{currentId ? "Swap this meal" : "Choose a recipe"} · <span className="capitalize">{slot}</span></DialogTitle>
        </DialogHeader>
        <Input placeholder="Search the cookbook…" value={q} onChange={(e) => setQ(e.target.value)} />
        <p className="text-xs text-muted-foreground">Best matches first — same meal type and similar protein.</p>
        <div className="-mx-2 max-h-[55vh] overflow-y-auto px-2">
          {currentId && (
            <button onClick={() => { onPick(null); onOpenChange(false); }} className="mb-2 w-full rounded-lg border border-dashed p-2 text-sm text-muted-foreground">Clear this slot</button>
          )}
          {list.map((r) => (
            <button
              key={r.id}
              onClick={() => { onPick(r.id); onOpenChange(false); }}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-muted"
            >
              <img src={r.image} alt="" className="h-12 w-12 flex-none rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.nutrition.protein}g protein · {r.totalMinutes} min · p.{r.cookbookPage}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
