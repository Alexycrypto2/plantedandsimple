import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeFreeGuide } from "@/lib/free-guide.functions";
import cover from "@/assets/cookbook-mockup.jpg";

const STORAGE_KEY = "planted-newsletter-closed";
const EXCLUDED = ["/checkout", "/thank-you", "/auth", "/admin", "/free", "/free-cookbook"];

export function NewsletterPopup() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (EXCLUDED.some((path) => window.location.pathname.startsWith(path))) return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    const timer = window.setTimeout(() => setOpen(true), 9000);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await subscribeFreeGuide({ data: { email, source: "newsletter_popup" } });
      window.localStorage.setItem(STORAGE_KEY, "subscribed");
      await navigate({ to: "/free-cookbook" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't send the guide. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-charcoal/45 p-3 backdrop-blur-sm sm:place-items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Free cookbook">
      <div className="relative grid max-h-[calc(100vh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-lg bg-cream shadow-2xl md:grid-cols-[0.82fr_1fr]">
        <Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Close" className="absolute right-3 top-3 z-10 bg-cream/90 text-charcoal hover:bg-cream-warm">
          <X />
        </Button>
        <img src={cover} alt="PlantedAndSimple plant-based cookbook" className="hidden h-full min-h-[420px] w-full object-cover md:block" />
        <div className="p-7 sm:p-10">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sage-soft text-forest"><BookOpen /></span>
          {complete ? (
            <>
              <h2 className="mt-6 font-display text-4xl italic leading-tight text-forest-deep">It’s on its way.</h2>
              <p className="mt-4 text-sm leading-relaxed text-charcoal/70">We queued your cookbook email. You can also open the download page immediately.</p>
              <Button asChild size="lg" className="mt-7 w-full"><Link to="/free-cookbook">Open your cookbook</Link></Button>
            </>
          ) : (
            <>
              <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-sage">A gift for your kitchen</p>
              <h2 className="mt-2 font-display text-4xl italic leading-tight text-forest-deep">20-minute plant protein, beautifully simple.</h2>
              <p className="mt-4 text-sm leading-relaxed text-charcoal/70">Get the free cookbook with fast recipes, practical prep ideas, and satisfying plant-based meals.</p>
              <form onSubmit={submit} className="mt-7 space-y-3">
                <label className="sr-only" htmlFor="popup-email">Email address</label>
                <input id="popup-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-md border border-forest/15 bg-white px-4 text-sm outline-none focus:border-forest" />
                <Button type="submit" size="lg" disabled={busy} className="w-full">{busy ? "Preparing your copy…" : "Send my free cookbook"}</Button>
              </form>
              {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
              <p className="mt-4 text-xs leading-relaxed text-charcoal/50">Immediate download. Unsubscribe anytime.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}