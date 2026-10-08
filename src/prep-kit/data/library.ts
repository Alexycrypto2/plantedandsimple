// Runtime recipe library: built-in cookbook + admin-managed cookbooks from the database.
// RECIPES and RECIPE_BY_ID are mutated in place so every existing screen picks up the library.
import { RECIPES } from "./recipes";
import { RECIPE_BY_ID } from "./content";
import type { Recipe } from "./types";

const BUILTIN: Recipe[] = [...RECIPES];
BUILTIN.forEach((r) => { if (!r.cookbook) r.cookbook = "core"; });

export type LibraryCookbook = { slug: string; title: string; isBuiltin: boolean };
export const COOKBOOKS: LibraryCookbook[] = [];

export function applyLibrary(lib: { cookbooks: LibraryCookbook[]; builtinActive: boolean; recipes: Recipe[] }) {
  lib.recipes.forEach((r, i) => { if (!r.image) r.image = BUILTIN[i % BUILTIN.length]!.image; });
  const next = [...(lib.builtinActive ? BUILTIN : []), ...lib.recipes];
  RECIPES.splice(0, RECIPES.length, ...next);
  for (const k of Object.keys(RECIPE_BY_ID)) delete RECIPE_BY_ID[k];
  // keep every known recipe resolvable so saved plans never break
  for (const r of [...BUILTIN, ...lib.recipes]) RECIPE_BY_ID[r.id] = r;
  COOKBOOKS.splice(0, COOKBOOKS.length, ...lib.cookbooks);
}
