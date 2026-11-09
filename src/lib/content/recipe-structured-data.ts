/** Local checks against Google's Recipe documentation, not Google's eligibility verdict. */
export const GOOGLE_RECIPE_DOCS = "https://developers.google.com/search/docs/appearance/structured-data/recipe";
export type SchemaFinding = { property: string; pass: boolean; message: string };
export type RecipeSchemaReport = { errors: SchemaFinding[]; recommendations: SchemaFinding[]; recipeCount: number };
type Node = Record<string, unknown>;
const object = (value: unknown): value is Node => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && !!value.trim();
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : value == null ? [] : [value];
const typeIs = (node: Node, type: string) => list(node["@type"]).some((t) => t === type || t === `https://schema.org/${type}` || t === `http://schema.org/${type}`);
const webUrl = (value: unknown) => {
  if (!text(value)) return false;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
};
const duration = (value: unknown) => text(value) && /^P(?=\d|T\d)(?:\d+(?:\.\d+)?D)?(?:T(?=\d)(?:\d+(?:\.\d+)?H)?(?:\d+(?:\.\d+)?M)?(?:\d+(?:\.\d+)?S)?)?$/.test(value);

/** Accept the JSON-LD script bodies extracted from the actual saved public page. */
export function validateRecipeScripts(scripts: string[]): RecipeSchemaReport {
  const errors: SchemaFinding[] = [];
  const recommendations: SchemaFinding[] = [];
  const nodes: Node[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (!object(value)) return;
    nodes.push(value);
    Object.values(value).forEach((child) => { if (object(child) || Array.isArray(child)) visit(child); });
  };
  scripts.forEach((script, i) => {
    try { visit(JSON.parse(script)); }
    catch { errors.push({ property: `JSON-LD script ${i + 1}`, pass: false, message: "Invalid JSON: repair the emitted structured data." }); }
  });
  const ids = new Map(nodes.filter((n) => text(n["@id"])).map((n) => [n["@id"], n]));
  const resolve = (value: unknown): unknown => object(value) && text(value["@id"]) ? { ...ids.get(value["@id"]), ...value } : value;
  const recipes = nodes.filter((n) => typeIs(n, "Recipe"));
  if (!recipes.length) errors.push({ property: "Recipe", pass: false, message: "No Recipe object found in the page's JSON-LD." });
  const imageValid = (value: unknown) => {
    const items = list(value).map(resolve);
    return items.length > 0 && items.every((v) => webUrl(v) || (object(v) && typeIs(v, "ImageObject") && (webUrl(v.contentUrl) || webUrl(v.url))));
  };
  const instructionsValid = (value: unknown): boolean => {
    const items = list(value).map(resolve);
    return items.length > 0 && items.every((v) => text(v) || (object(v) && (
      (typeIs(v, "HowToStep") && (text(v.text) || (list(v.itemListElement).length > 0 && list(v.itemListElement).map(resolve).every((step) => object(step) && (typeIs(step, "HowToDirection") || typeIs(step, "HowToTip")) && text(step.text))))) ||
      (typeIs(v, "HowToSection") && text(v.name) && instructionsValid(v.itemListElement))
    )));
  };
  recipes.forEach((r, index) => {
    const prefix = recipes.length > 1 ? `Recipe ${index + 1}: ` : "";
    const check = (target: SchemaFinding[], property: string, pass: boolean, message: string) => target.push({ property: prefix + property, pass, message });
    check(errors, "name", text(r.name), "Google requires a nonempty recipe name.");
    check(errors, "image", imageValid(r.image), "Google requires a recipe image URL or ImageObject. Image crawlability and relevance need external verification.");
    const nutrition = resolve(r.nutrition);
    const calories = object(nutrition) ? nutrition.calories : undefined;
    const yields = list(r.recipeYield);
    if (object(nutrition) && Object.keys(nutrition).some((key) => !key.startsWith("@"))) {
      check(errors, "recipeYield (when per-serving nutrition supplied)", yields.some((v) => typeof v === "number" ? Number.isFinite(v) && v > 0 : text(v) && /^\d+(?:\.\d+)?(?:\s+servings?)?$/i.test(v.trim()) && parseFloat(v) > 0), "When per-serving nutrition is supplied, Google requires recipeYield to state the number of servings; an item count alone is insufficient.");
    }
    if (r.recipeInstructions != null) check(errors, "recipeInstructions format (when supplied)", instructionsValid(r.recipeInstructions), "Supplied steps need text or HowToDirection/HowToTip substeps; sections need a name and valid steps.");
    check(recommendations, "description", text(r.description), "Add a truthful recipe summary.");
    const authors = list(r.author).map(resolve);
    check(recommendations, "author", authors.length > 0 && authors.every((v) => object(v) && (typeIs(v, "Person") || typeIs(v, "Organization")) && text(v.name)), "Use a named Person or Organization author.");
    check(recommendations, "recipeIngredient", Array.isArray(r.recipeIngredient) && r.recipeIngredient.length > 0 && r.recipeIngredient.every(text), "List the real ingredients; Google sets no minimum ingredient count.");
    check(recommendations, "recipeInstructions", instructionsValid(r.recipeInstructions), "Use nonempty instruction text, HowToStep text, or named HowToSection groups; there is no minimum step count.");
    check(recommendations, "recipeYield", yields.length > 0 && yields.every((v) => text(v) || (typeof v === "number" && Number.isFinite(v) && v > 0)), "Describe the recipe yield. A servings count is required when per-serving nutrition is supplied.");
    const hasPair = r.prepTime != null || r.cookTime != null;
    check(recommendations, "prepTime / cookTime / totalTime", hasPair ? duration(r.prepTime) && duration(r.cookTime) && (r.totalTime == null || duration(r.totalTime)) : duration(r.totalTime), "Use ISO 8601 durations. If prepTime or cookTime is supplied, supply both; totalTime alone is also supported.");
    check(recommendations, "nutrition.calories", object(nutrition) && typeIs(nutrition, "NutritionInformation") && text(calories) && /^\d+(?:\.\d+)?\s*(?:kcal|cal|calories|kilocalories)$/i.test(calories), "Calories are recommended, not universally required. Add only verified per-serving nutrition with units.");
    for (const property of ["recipeCategory", "recipeCuisine", "keywords"]) {
      check(recommendations, property, list(r[property]).length > 0 && list(r[property]).every(text), `Add accurate ${property} information if known.`);
    }
    check(recommendations, "datePublished", text(r.datePublished) && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(r.datePublished) && Number.isFinite(Date.parse(r.datePublished)), "Use the actual publication date in ISO 8601 format.");
  });
  return { errors, recommendations, recipeCount: recipes.length };
}