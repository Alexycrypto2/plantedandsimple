import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeFreeGuide } from "@/lib/free-guide.functions";
import { getSiteSettings } from "@/lib/library/library.functions";
import { DEFAULT_POPUP, POPUP_SETTING_KEY, normalizePopup, popupAllowedOn, type PopupConfig } from "@/lib/popup-config";
import bundle from "@/assets/free-cookbook-bundle.jpg";

const STORAGE_KEY = "planted-newsletter-closed";
const SUBSCRIBED_KEY = "planted-subscribed";

const SALES_COPY = {
  eyebrow: "Not ready yet?",
  headline: "Start with 12 free high-protein recipes.",
  body: "Try our recipes free first — get the guide instantly by email.",
}; 

export function isSalesPage(path: string) {
  return /^\/(shop|products)\/[^/]+/.test(path);
}

export function isSubscribed() {
  try {
    return window.localStorage.getItem(SUBSCRIBED_KEY) === "1" || window.localStorage.getItem(STORAGE_KEY) === "subscribed";
  } catch {
    return false;
  }
}
export function markSubscribed() {
  try { window.localStorage.setItem(SUBSCRIBED_KEY, "1"); } catch { /* ignore */ }
}

export function NewsletterPopup() {
  const [cfg, setCfg] = useState<PopupConfig | null>(null);
  const [sales, setSales] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    getSiteSettings().then((s) => alive && setCfg(normalizePopup(s?.[POPUP_SETTING_KEY])), () => alive && setCfg(DEFAULT_POPUP));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!cfg || !cfg.enabled) return;
    const path = window.location.pathname;
    const salesPage = isSalesPage(path);
    if (!salesPage && !popupAllowedOn(cfg.pages, path)) return;
    if (isSubscribed()) return;
    const dismissed = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
    if (dismissed && Date.now() - dismissed < cfg.dismissDays * 86400000) return;
    let shown = false;
    let stop = () => {};
    const show = () => { if (!shown && !isSubscribed()) { shown = true; setSales(salesPage); setOpen(true); stop();  } };
    if (salesPage) {
      // Sales pages: never interrupt a buyer early — only catch them as they leave.
      const onLeaveS = (e: MouseEvent) => { if (e.clientY <= 0 && !e.relatedTarget) show(); };
      let maxY = 0;
      const onScrollS = () => {
        const y = window.scrollY;
        maxY = Math.max(maxY, y);
        const h = document.documentElement;
        const deep = maxY / Math.max(1, h.scrollHeight - h.clientHeight) > 0.4;
        if (deep && maxY - y > h.clientHeight * 0.8) show(); // fast scroll back up = leaving
      };
      const idle = window.setTimeout(show, 45000);
      const onHide = () => { if (document.visibilityState === "hidden") window.clearTimeout(idle); };
      document.addEventListener("mouseout", onLeaveS);
      window.addEventListener("scroll", onScrollS, { passive: true });
      document.addEventListener("visibilitychange", onHide);
      stop = () => {
        window.clearTimeout(idle);
        document.removeEventListener("mouseout", onLeaveS);
        window.removeEventListener("scroll", onScrollS);
        document.removeEventListener("visibilitychange", onHide);
      };
      return () => stop();
    }
    const onScroll = () => {
      const h = document.documentElement;
      if (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) > cfg.scrollPercent / 100) show();
    };
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0 && !e.relatedTarget) show(); };
    const timer = cfg.delaySeconds ? window.setTimeout(show, cfg.delaySeconds * 1000) : undefined;
    if (cfg.scrollPercent) window.addEventListener("scroll", onScroll, { passive: true });
    const desktop = window.matchMedia("(pointer: fine)").matches;
    if (cfg.exitIntent && desktop) document.addEventListener("mouseout", onLeave);
    stop = () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onLeave);
    };
    return () => stop();
  }, [cfg]);

  if (!open || !cfg) return null;
  return (
    <PopupView
      cfg={sales ? { ...cfg, ...SALES_COPY } : cfg}
      onClose={() => { window.localStorage.setItem(STORAGE_KEY, String(Date.now())); setOpen(false); }}
    />
  );
}

/** Pure presentation; also used by the admin live preview (preview = contained, no submit). */
export function PopupView({ cfg, onClose, preview }: { cfg: PopupConfig; onClose: () => void; preview?: "desktop" | "mobile" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (preview) return;
    setBusy(true);
    setError(null);
    try {
      await subscribeFreeGuide({ data: { email, source: `newsletter_popup_${cfg.template}` } });
      markSubscribed();
      await navigate({ to: "/free-cookbook" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't send the guide. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const mobile = preview === "mobile";
  const pos = preview ? "absolute" : "fixed";
  const compact = cfg.template === "corner";

  const content = (
    <>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-sage">{cfg.eyebrow}</p>
      <h2 className={`mt-1.5 font-display italic leading-tight text-forest-deep ${compact ? "text-xl" : "text-2xl sm:text-[1.7rem]"}`}>{cfg.headline}</h2>
      {cfg.body && !compact ? <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{cfg.body}</p> : null}
      {cfg.perks.length && !compact ? (
        <ul className="mt-3 space-y-1">
          {cfg.perks.map((p) => <li key={p} className="flex items-center gap-2 text-xs font-medium text-charcoal/80"><Check className="h-3.5 w-3.5 text-forest" />{p}</li>)}
        </ul>
      ) : null}
      <form onSubmit={submit} className="mt-4 space-y-2">
        <label className="sr-only" htmlFor="popup-email">Email address</label>
        <input id="popup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 w-full rounded-md border border-forest/15 bg-background px-3.5 text-sm outline-none focus:border-forest" />
        <Button type="submit" disabled={busy} className="h-11 w-full">{busy ? "Preparing your copy…" : cfg.button}</Button>
      </form>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {cfg.note ? <p className="mt-2.5 text-[11px] text-charcoal/50">{cfg.note}</p> : null}
    </>
  );

  const close = (
    <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-cream/90 text-charcoal hover:bg-cream-warm">
      <X className="h-4 w-4" />
    </Button>
  );

  if (cfg.template === "corner") {
    return (
      <div role="dialog" aria-label="Free cookbook" className={`${pos} bottom-3 right-3 z-[80] w-[calc(100%-1.5rem)] max-w-[340px] overflow-hidden rounded-xl border border-forest/10 bg-cream shadow-2xl animate-in slide-in-from-bottom-4`}>
        {close}
        <img src={bundle} alt="Free cookbook on tablet, phone and printed pages" className="h-28 w-full object-cover" />
        <div className="p-4">{content}</div>
      </div>
    );
  }

  const drawer = cfg.template === "drawer";
  const stacked = drawer || mobile;
  return (
    <div className={`${pos} inset-0 z-[80] flex ${drawer ? "items-end" : "items-end sm:items-center"} justify-center bg-charcoal/45 ${drawer ? "" : "p-3"} backdrop-blur-[2px]`} role="dialog" aria-modal="true" aria-label="Free cookbook">
      <div className={`relative w-full overflow-hidden bg-cream shadow-2xl animate-in slide-in-from-bottom-6 ${drawer ? "max-w-xl rounded-t-2xl" : "max-w-[540px] rounded-xl"} max-h-[90%] overflow-y-auto ${stacked ? "" : "sm:grid sm:grid-cols-[0.9fr_1fr]"}`}>
        {close}
        {drawer ? <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-forest/20" /> : null}
        <img src={bundle} alt="Free cookbook on tablet, phone and printed pages" className={stacked ? "h-32 w-full object-cover" : "h-32 w-full object-cover sm:h-full sm:min-h-[300px]"} />
        <div className="p-5 sm:p-6">{content}</div>
      </div>
    </div>
  );
}
