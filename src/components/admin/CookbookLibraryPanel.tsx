import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Sparkles, Loader2, Eye, EyeOff, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PanelCard } from "@/components/admin/AdminShell";
import {
  adminListCookbooks, adminSaveCookbook, adminToggle, adminDelete, adminExtractRecipes, adminSaveRecipes,
  type ExtractedRecipe,
} from "@/lib/prep-library.functions";

export function CookbookLibraryPanel() {
  const qc = useQueryClient();
  const list = useServerFn(adminListCookbooks);
  const save = useServerFn(adminSaveCookbook);
  const toggle = useServerFn(adminToggle);
  const del = useServerFn(adminDelete);
  const extract = useServerFn(adminExtractRecipes);
  const saveRecipes = useServerFn(adminSaveRecipes);
  const q = useQuery({ queryKey: ["admin-cookbooks"], queryFn: () => list() });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-cookbooks"] }); qc.invalidateQueries({ queryKey: ["prep-library"] }); };

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cover, setCover] = useState("");
  const [openBook, setOpenBook] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ExtractedRecipe[]>([]);

  const createM = useMutation({
    mutationFn: () => save({ data: { title, description: desc || undefined, coverUrl: cover || undefined } }),
    onSuccess: () => { toast.success("Cookbook added"); setTitle(""); setDesc(""); setCover(""); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleM = useMutation({
    mutationFn: (v: { kind: "cookbook" | "recipe"; id: string; active: boolean }) => toggle({ data: v }),
    onSuccess: refresh, onError: (e: Error) => toast.error(e.message),
  });
  const delM = useMutation({
    mutationFn: (v: { kind: "cookbook" | "recipe"; id: string }) => del({ data: v }),
    onSuccess: () => { toast.success("Removed"); refresh(); }, onError: (e: Error) => toast.error(e.message),
  });
  const extractM = useMutation({
    mutationFn: () => extract({ data: { text } }),
    onSuccess: (r) => { if (r.error) toast.error(r.error); setPreview(r.recipes); if (r.recipes.length) toast.success(`Gemini found ${r.recipes.length} recipe(s)`); },
    onError: (e: Error) => toast.error(e.message),
  });
  const saveM = useMutation({
    mutationFn: () => saveRecipes({ data: { cookbookId: openBook!, recipes: preview } }),
    onSuccess: (r) => { toast.success(`${r.saved} recipe(s) added`); setPreview([]); setText(""); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const books = q.data?.cookbooks ?? [];
  const recipes = q.data?.recipes ?? [];
  const field = "w-full rounded-xl border bg-background px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <PanelCard title="Add a cookbook">
        <p className="mb-3 text-sm text-muted-foreground">Every active cookbook shows up in the members' Meal Prep System — planner, grocery list and recipe library.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <input className={field} placeholder="Cookbook title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className={field} placeholder="Short description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <input className={field} placeholder="Cover image link (optional)" value={cover} onChange={(e) => setCover(e.target.value)} />
        </div>
        <button disabled={title.trim().length < 2 || createM.isPending} onClick={() => createM.mutate()}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          <Plus className="h-4 w-4" /> Add cookbook
        </button>
      </PanelCard>

      <PanelCard title="Your cookbooks">
        {q.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (
          <div className="space-y-3">
            {books.map((b) => {
              const own = recipes.filter((r) => r.cookbookId === b.id);
              const open = openBook === b.id;
              return (
                <div key={b.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{b.title} {b.isBuiltin && <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs">Original</span>}</p>
                      <p className="text-xs text-muted-foreground">{b.recipeCount} recipes · {b.active ? "Showing to members" : "Hidden"}</p>
                    </div>
                    <button onClick={() => toggleM.mutate({ kind: "cookbook", id: b.id, active: !b.active })} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold">
                      {b.active ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Show</>}
                    </button>
                    {!b.isBuiltin && <>
                      <button onClick={() => { setOpenBook(open ? null : b.id); setPreview([]); }} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                        <Sparkles className="h-3.5 w-3.5" /> {open ? "Close" : "Add recipes with AI"}
                      </button>
                      <button onClick={() => confirm(`Delete "${b.title}" and its recipes?`) && delM.mutate({ kind: "cookbook", id: b.id })} className="rounded-full border p-1.5 text-destructive" aria-label="Delete cookbook">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <p className="text-sm text-muted-foreground">Paste one or more recipes (copied from your PDF or notes). Gemini reads them and fills in times, nutrition, ingredients and steps for you to check.</p>
                      <textarea className={`${field} min-h-48 font-mono text-xs`} placeholder="Paste recipe text here…" value={text} onChange={(e) => setText(e.target.value)} />
                      <button disabled={text.trim().length < 40 || extractM.isPending} onClick={() => extractM.mutate()}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                        {extractM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {extractM.isPending ? "Gemini is reading…" : "Read with Gemini"}
                      </button>
                      {preview.length > 0 && (
                        <div className="space-y-2">
                          {preview.map((r, i) => (
                            <div key={i} className="rounded-xl border bg-background p-3 text-sm">
                              <div className="flex items-start gap-2">
                                <input className="flex-1 rounded-lg border bg-card px-2 py-1 font-semibold" value={r.title}
                                  onChange={(e) => setPreview(preview.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                                <button onClick={() => setPreview(preview.filter((_, j) => j !== i))} aria-label="Remove"><X className="h-4 w-4" /></button>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {r.category} · {r.totalMinutes} min · {r.nutrition.calories} kcal · {r.nutrition.protein} g protein · {r.ingredients.length} ingredients · {r.steps.length} steps
                              </p>
                            </div>
                          ))}
                          <button disabled={saveM.isPending} onClick={() => saveM.mutate()}
                            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                            Save {preview.length} recipe(s) to this cookbook
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {own.length > 0 && (
                    <ul className="mt-3 divide-y text-sm">
                      {own.map((r) => (
                        <li key={r.id} className="flex items-center gap-2 py-2">
                          <span className={`flex-1 truncate ${r.active ? "" : "text-muted-foreground line-through"}`}>{r.title}</span>
                          <span className="hidden text-xs text-muted-foreground sm:inline">{r.category} · {r.protein} g protein</span>
                          <button onClick={() => toggleM.mutate({ kind: "recipe", id: r.id, active: !r.active })} aria-label={r.active ? "Hide recipe" : "Show recipe"}>
                            {r.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button onClick={() => delM.mutate({ kind: "recipe", id: r.id })} className="text-destructive" aria-label="Delete recipe"><Trash2 className="h-4 w-4" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PanelCard>
    </div>
  );
}
