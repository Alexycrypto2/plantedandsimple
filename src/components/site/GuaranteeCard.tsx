import { Link } from "@tanstack/react-router";
import { ShieldCheck, Download, ChefHat, Mail } from "lucide-react";

const STEPS = [
  { icon: Download, title: "Download & cook", text: "Get instant access and try the recipes in your own kitchen." },
  { icon: ChefHat, title: "Take 60 days", text: "Cook through it on real weeknights — no rush." },
  { icon: Mail, title: "Not for you? Email us", text: "Write to support and we'll refund your purchase." },
];

/** Shared money-back guarantee block. `compact` for inline use inside offers. */
export function GuaranteeCard({ body, compact }: { body?: string; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-forest/15 bg-cream-warm p-4 text-left">
        <Seal small />
        <div className="text-sm leading-relaxed text-charcoal/75">
          <p className="font-semibold text-forest-deep">60-day money-back guarantee</p>
          <p>{body ?? "Try it risk-free. If it's not for you, email us for a full refund."}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-forest/15 bg-cream-warm p-7 sm:p-12">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
        <Seal />
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-sage">Risk-free promise</p>
          <h2 className="mt-2 font-display text-3xl italic leading-tight text-forest-deep sm:text-4xl">Love it, or get your money back.</h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-charcoal/75">
            {body ?? "Try your purchase. If it's not for you, email us within 60 days for a refund."}
          </p>
        </div>
      </div>
      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-start gap-3 rounded-2xl bg-background p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest/10 text-forest"><s.icon className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-semibold text-forest-deep">{i + 1}. {s.title}</p>
              <p className="mt-0.5 text-sm leading-snug text-charcoal/65">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-center text-xs text-charcoal/60">
        Questions? <a href="mailto:support@plantedandsimple.com" className="underline underline-offset-2">support@plantedandsimple.com</a> ·{" "}
        <Link to="/refund" className="underline underline-offset-2">Refund policy</Link>
      </p>
    </div>
  );
}

function Seal({ small }: { small?: boolean }) {
  const size = small ? "h-11 w-11" : "h-24 w-24";
  return (
    <div className={`relative grid ${size} shrink-0 place-items-center rounded-full bg-forest text-cream shadow-md ring-4 ring-forest/15`}>
      {small ? (
        <ShieldCheck className="h-5 w-5" />
      ) : (
        <div className="text-center leading-none">
          <ShieldCheck className="mx-auto h-5 w-5 opacity-80" />
          <p className="mt-1 font-display text-3xl italic">60</p>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] opacity-80">day</p>
        </div>
      )}
    </div>
  );
}
