import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeFreeGuide } from "@/lib/free-guide.functions";
import { trackEvent } from "@/lib/analytics";
import { isSubscribed, markSubscribed } from "@/components/NewsletterPopup";
import cookbookMockup from "@/assets/cookbook-mockup.jpg";

/** Article-end conversion block: free cookbook signup first, then the premium cookbook. */
export function ContentEndFunnel({ source }: { source: "recipe" | "blog" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => setSubscribed(isSubscribed()), []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await subscribeFreeGuide({ data: { email, source: `${source}_end_block` } });
      markSubscribed();
      trackEvent?.("free_guide_signup", { source: `${source}_end_block` } as never);
      await navigate({ to: "/free-cookbook" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't send the guide. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-16 space-y-6">
      <section className="rounded-[2rem] bg-sage-soft/60 p-7 sm:p-10">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cream text-forest"><BookOpen /></span>
        {subscribed ? (
          <>
            <h2 className="mt-4 font-display text-3xl italic text-forest-deep">Your free cookbook is ready</h2>
            <p className="mt-2 text-sm text-charcoal/70">You’re on the list. Open your free recipes any time.</p>
            <Button asChild size="lg" className="mt-5"><Link to="/free-cookbook">Open free cookbook</Link></Button>
          </>
        ) : (
          <>
            <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-forest">Free for you</p>
            <h2 className="mt-1 font-display text-3xl italic text-forest-deep">
              {source === "recipe" ? "Want more meals like this one?" : "Make this easier in your kitchen"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/70">Get our free plant-based cookbook: quick high-protein recipes and simple prep ideas, sent straight to your inbox.</p>
            <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor={`end-email-${source}`}>Email address</label>
              <input id={`end-email-${source}`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 flex-1 rounded-md border border-forest/15 bg-background px-4 text-sm outline-none focus:border-forest" />
              <Button type="submit" size="lg" disabled={busy} className="h-12">{busy ? "Sending…" : "Send my free cookbook"}</Button>
            </form>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            <p className="mt-3 text-xs text-charcoal/50">Instant download. Unsubscribe anytime.</p>
          </>
        )}
      </section>

      <section className="grid items-center gap-6 overflow-hidden rounded-[2rem] bg-cream-warm/70 p-6 sm:grid-cols-[180px_1fr] sm:p-8">
        <img src={cookbookMockup} alt="30 High-Protein Plant-Based Meals cookbook" loading="lazy" className="mx-auto w-40 rounded-xl shadow-lg sm:w-full" />
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-sage">Ready for the full collection?</p>
          <h2 className="mt-1 font-display text-2xl italic text-forest-deep sm:text-3xl">30 High-Protein Plant-Based Meals</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-charcoal/75">
            {["30 tested recipes with macros", "Weekly meal plans & grocery lists", "60-day money-back guarantee"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-forest" />{t}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" onClick={() => trackEvent?.("content_cookbook_click", { source } as never)}>
              <Link to="/shop/$slug" params={{ slug: "high-protein-cookbook" }}>Get the cookbook — $14.99</Link>
            </Button>
            <span className="text-xs text-charcoal/50 line-through">$29.99</span>
          </div>
        </div>
      </section>
    </div>
  );
}
