import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOOGLE_RECIPE_DOCS, validateRecipeScripts, type RecipeSchemaReport } from "@/lib/content/recipe-structured-data";

export function RenderedRecipeAudit({ slug }: { slug?: string }) {
  const [report, setReport] = useState<RecipeSchemaReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    request.current?.abort();
    setReport(null); setError(null); setChecked(null); setBusy(false);
    return () => request.current?.abort();
  }, [slug]);
  const audit = async () => {
    if (!slug) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 15000);
    setBusy(true); setError(null); setReport(null);
    try {
      const response = await fetch(`/recipes/${encodeURIComponent(slug)}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`The saved page could not be checked (${response.status}). Publish and save the recipe, then retry.`);
      const html = await response.text();
      if (controller.signal.aborted) return;
      const document = new DOMParser().parseFromString(html, "text/html");
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent ?? "");
      setReport(validateRecipeScripts(scripts));
      setChecked(new Date().toLocaleTimeString());
    } catch (e) {
      if (request.current === controller) setError(controller.signal.aborted ? "The page check timed out. Retry when the page is available." : e instanceof Error ? e.message : "The page could not be checked.");
    } finally {
      clearTimeout(timer);
      if (request.current === controller) setBusy(false);
    }
  };
  const failures = report?.errors.filter((f) => !f.pass).length ?? 0;
  return (
    <section className="mt-4 space-y-3 border-t border-border pt-4" aria-label="Rendered recipe structured data">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Saved page · Recipe structured data</h3>
        <Button size="sm" variant="outline" disabled={!slug || busy} onClick={audit}>
          {busy && <Loader2 className="animate-spin" />} Check saved page
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Checks the JSON-LD emitted by the saved public page on this host, not editor fields. Unsaved edits are excluded; save and recheck after changes. Drafts must be published first.</p>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {report && <>
        <p role="status" className="text-xs font-semibold text-foreground">{failures ? `${failures} required-field issue(s)` : "Required-field checks passed locally"} · {report.recipeCount} Recipe object(s) · checked {checked}</p>
        {([{ title: "Google requirements", items: report.errors }, { title: "Google recommendations · not eligibility blockers when absent", items: report.recommendations }]).map(({ title, items }) => (
          <div key={title}>
            <h4 className="mb-2 text-xs font-semibold text-foreground">{title}</h4>
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((item) => <li key={item.property} className="flex items-start gap-2 text-xs">
                {item.pass ? <Check className="h-4 w-4 shrink-0 text-primary" /> : <X className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <span className="min-w-0 break-words text-foreground">{item.property}{!item.pass && <span className="block text-muted-foreground">{item.message}</span>}</span>
              </li>)}
            </ul>
          </div>
        ))}
      </>}
      <p className="text-xs text-muted-foreground">Local checks do not verify Google indexing, image access, factual accuracy, content policies, ratings or every optional property. Passing does not guarantee rankings or rich results.</p>
      <div className="flex flex-wrap gap-3 text-xs">
        <a href={GOOGLE_RECIPE_DOCS} target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Recipe guidelines</a>
        {slug && <a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(`https://plantedandsimple.com/recipes/${encodeURIComponent(slug)}`)}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">Test live URL with Google</a>}
      </div>
    </section>
  );
}