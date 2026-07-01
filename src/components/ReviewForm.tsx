import { useState } from "react";
import { submitReview } from "@/lib/reviews.functions";

export function ReviewForm({ transactionId }: { transactionId?: string }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; msg: string }
  >({ kind: "idle" });

  if (state.kind === "done") {
    return (
      <div className="rounded-2xl border border-sage/40 bg-sage/10 p-6 text-left">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
          Thank you 🌱
        </p>
        <p className="mt-2 text-sm text-charcoal/80">
          Your review has been submitted. Once approved, it'll appear on the
          site to help other readers.
        </p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ kind: "sending" });
    try {
      await submitReview({
        data: { name, location, rating, quote, transactionId },
      });
      setState({ kind: "done" });
    } catch (err) {
      setState({
        kind: "error",
        msg: err instanceof Error ? err.message : "Could not submit review",
      });
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-sage/30 bg-cream/60 p-6 text-left"
    >
      <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-sage">
        Leave a review
      </p>
      <h3 className="mt-2 font-display text-xl italic text-forest-deep">
        Cooked something you loved?
      </h3>
      <p className="mt-1 text-sm text-charcoal/70">
        Share a short note — approved reviews go on the sales page.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-charcoal/70">Your name</span>
          <input
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-forest/15 bg-white px-3 py-2 outline-none focus:border-forest"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-charcoal/70">
            Location <span className="text-charcoal/40">(optional)</span>
          </span>
          <input
            maxLength={80}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Austin, TX"
            className="w-full rounded-lg border border-forest/15 bg-white px-3 py-2 outline-none focus:border-forest"
          />
        </label>
      </div>

      <div className="mt-3 text-sm">
        <span className="mb-1 block text-charcoal/70">Rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className={`text-2xl leading-none ${n <= rating ? "text-forest" : "text-charcoal/25"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <label className="mt-3 block text-sm">
        <span className="mb-1 block text-charcoal/70">Your review</span>
        <textarea
          required
          minLength={10}
          maxLength={600}
          rows={4}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Which recipe did you try? How did it go?"
          className="w-full resize-none rounded-lg border border-forest/15 bg-white px-3 py-2 outline-none focus:border-forest"
        />
      </label>

      {state.kind === "error" && (
        <p className="mt-3 text-sm text-red-600">{state.msg}</p>
      )}

      <button
        type="submit"
        disabled={state.kind === "sending"}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-forest-deep disabled:opacity-60"
      >
        {state.kind === "sending" ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}