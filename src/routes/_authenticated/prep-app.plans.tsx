import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Trash2, Pencil } from "lucide-react";
import { PageHeader, Empty } from "@/components/AppShell";
import { useDeletePlan, usePlans, useSavePlan } from "@/lib/data";
import { planRecipeCounts } from "@/lib/grocery";

export const Route = createFileRoute("/_authenticated/plans")({
  head: () => ({ meta: [{ title: "Saved weeks — Planted & Simple" }, { name: "description", content: "Rename, repeat or delete past weeks." }, { property: "og:title", content: "Saved weeks — Planted & Simple" }, { property: "og:description", content: "Repeat weeks you loved." }] }),
  component: Plans,
});

function Plans() {
  const plans = usePlans();
  const save = useSavePlan();
  const del = useDeletePlan();
  const navigate = useNavigate();

  async function repeat(id: string) {
    const p = plans.data?.find((x) => x.id === id);
    if (!p) return;
    await save.mutateAsync({ name: `${p.name} (again)`, slots: p.slots, source: p.source, is_current: true, grocery_checked: [], prep_done: [] });
    toast.success("Loaded as this week");
    navigate({ to: "/planner" });
  }

  return (
    <div>
      <PageHeader eyebrow="Keep the favourites" title="Saved weeks" />
      {!plans.data?.length ? <Empty title="No weeks yet">Every week you plan is kept here so you can repeat it.</Empty> : (
        <ul className="space-y-3">
          {plans.data.map((p) => {
            const meals = [...planRecipeCounts(p.slots).values()].reduce((a, b) => a + b, 0);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-primary">{p.name} {p.is_current && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase text-gold-foreground">This week</span>}</p>
                  <p className="text-xs text-muted-foreground">{meals} meals · updated {new Date(p.updated_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => { const n = prompt("Rename this week", p.name); if (n?.trim()) save.mutate({ id: p.id, name: n.trim().slice(0, 80) }); }} className="rounded-full p-2 text-primary hover:bg-muted" aria-label="Rename"><Pencil className="h-4 w-4" /></button>
                {!p.is_current && <button onClick={() => repeat(p.id)} className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold text-primary"><Copy className="h-4 w-4" /> Repeat</button>}
                <button onClick={() => { if (confirm("Delete this week?")) del.mutate(p.id); }} className="rounded-full p-2 text-destructive hover:bg-muted" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
