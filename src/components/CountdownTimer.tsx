import { useEffect, useState } from "react";

const STORAGE_KEY = "pas_offer_deadline";
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h rolling window

function setNextDeadline(): number {
  const next = Date.now() + WINDOW_MS;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  }
  return next;
}

function getDeadline(): number {
  if (typeof window === "undefined") return Date.now() + WINDOW_MS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (!parsed || Number.isNaN(parsed) || parsed < Date.now()) {
    return setNextDeadline();
  }
  return parsed;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function useOfferCountdown() {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setDeadline(getDeadline());
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      setDeadline((currentDeadline) => {
        if (currentDeadline !== null && current >= currentDeadline) {
          return setNextDeadline();
        }
        return currentDeadline;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, (deadline ?? Date.now() + WINDOW_MS) - now);
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
  const timeText = `${hours}h ${minutes}m`;

  return {
    remaining,
    expired: false,
    hours,
    minutes,
    seconds,
    timeText,
    urgencyText: `Launch savings refresh in ${timeText}`,
  };
}

type Props = {
  variant?: "light" | "dark";
  label?: string;
  expiredLabel?: string;
};

export function CountdownTimer({
  variant = "dark",
  label = "Launch price ends in",
  expiredLabel: _expiredLabel = "Offer refreshed — today’s launch savings are open",
}: Props) {
  const { hours, minutes, seconds, urgencyText } = useOfferCountdown();

  const isLight = variant === "light";
  const labelClass = isLight ? "text-forest/70" : "text-sage-soft";
  const boxClass = isLight
    ? "bg-forest text-cream ring-1 ring-forest/20"
    : "bg-cream/10 text-cream ring-1 ring-cream/20 backdrop-blur";
  const sepClass = isLight ? "text-forest/40" : "text-cream/40";
  const captionClass = isLight ? "text-forest/60" : "text-cream/60";

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <p
        className={`font-mono text-[11px] font-semibold uppercase tracking-[0.28em] ${labelClass}`}
      >
        ⏳ {label || urgencyText}
      </p>
      <div className="flex items-center gap-2 sm:gap-3">
        {[
          { v: hours, l: "Hrs" },
          { v: minutes, l: "Min" },
          { v: seconds, l: "Sec" },
        ].map((seg, i) => (
          <div key={seg.l} className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex min-w-[3.5rem] flex-col items-center rounded-xl px-3 py-2 sm:min-w-[4.25rem] sm:px-4 sm:py-3 ${boxClass}`}
            >
              <span className="font-display text-2xl font-bold tabular-nums sm:text-3xl">
                {pad(seg.v)}
              </span>
              <span
                className={`font-mono text-[9px] uppercase tracking-widest ${captionClass}`}
              >
                {seg.l}
              </span>
            </div>
            {i < 2 && (
              <span className={`font-display text-2xl sm:text-3xl ${sepClass}`}>
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CountdownTimer;