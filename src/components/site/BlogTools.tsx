import { useEffect, useState } from "react";
import { pinterestUrl } from "./RecipeTools";

export function slugifyHeading(t: string) {
  return t.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/** Adds stable ids to <h2> tags and returns the outline. */
export function withHeadingIds(html: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (full, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
    if (!text) return full;
    const existing = attrs.match(/\sid=["']([^"']+)["']/);
    let id = existing?.[1] || slugifyHeading(text) || `section-${toc.length + 1}`;
    while (used.has(id)) id += "-2";
    used.add(id);
    toc.push({ id, text });
    return existing ? full : `<h2${attrs} id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

export function readingMinutes(html: string) {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

export function TableOfContents({ toc }: { toc: { id: string; text: string }[] }) {
  const [open, setOpen] = useState(true);
  if (toc.length < 3) return null;
  return (
    <nav aria-label="In this article" className="no-print mt-10 rounded-[1.5rem] border border-forest/15 bg-cream-warm p-5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between text-left">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest">In this article</span>
        <span className="text-forest">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <ol className="mt-3 space-y-2 text-sm">
          {toc.map((t, i) => (
            <li key={t.id} className="flex gap-3">
              <span className="font-mono text-xs text-sage">{String(i + 1).padStart(2, "0")}</span>
              <a href={`#${t.id}`} className="text-charcoal/80 underline-offset-4 hover:text-forest hover:underline">{t.text}</a>
            </li>
          ))}
        </ol>
      ) : null}
    </nav>
  );
}

export function ShareBar({ title, image }: { title: string; image?: string | null }) {
  const [href, setHref] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setHref(window.location.href), []);
  if (!href) return null;
  const abs = image ? new URL(image, href).toString() : null;
  const cls = "rounded-full border border-forest/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest hover:bg-forest hover:text-cream";
  return (
    <div className="no-print mt-6 flex flex-wrap gap-2">
      <a href={pinterestUrl(href, abs, title)} target="_blank" rel="noopener noreferrer" className={cls}>Save to Pinterest</a>
      <button type="button" className={cls} onClick={async () => { try { await navigator.clipboard.writeText(href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ } }}>
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
