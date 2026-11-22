import { useEffect, useState } from "react";
import { toast } from "sonner";
import { computeBadges, longestStreak, readHistory, savings, type Badge } from "../lib/badges";

export interface ShelfInput { plannedMeals: number; prepComplete: boolean; groceryComplete: boolean; favourites: number }

/** 12-badge shelf + estimated lifetime savings. Announces newly earned badges once. */
export function BadgeShelf({ input, refresh }: { input: ShelfInput; refresh?: unknown }) {
  const [data, setData] = useState<{ badges: Badge[]; meals: number } | null>(null);
  useEffect(() => {
    const h = readHistory();
    const badges = computeBadges({ ...input, mealsLogged: h.mealsLogged, goalDays: h.goalDays, bestStreak: longestStreak(h.loggedDates) });
    let seen: string[] = [];
    try { seen = JSON.parse(localStorage.getItem("prep-badges-seen") ?? "[]"); } catch { /* ignore */ }
    const fresh = badges.filter((b) => b.earned && !seen.includes(b.id));
    if (fresh.length) {
      if (localStorage.getItem("prep-badges-seen")) fresh.forEach((b) => toast.success(`${b.icon} Badge unlocked: ${b.title}`, { description: b.hint }));
      try { localStorage.setItem("prep-badges-seen", JSON.stringify(badges.filter((b) => b.earned).map((b) => b.id))); } catch { /* ignore */ }
    } else if (!localStorage.getItem("prep-badges-seen")) { try { localStorage.setItem("prep-badges-seen", "[]"); } catch { /* ignore */ } }
    setData({ badges, meals: h.mealsLogged });
  }, [input.plannedMeals, input.prepComplete, input.groceryComplete, input.favourites, refresh]);
  if (!data) return null;
  const earned = data.badges.filter((b) => b.earned).length;
  const s = savings(data.meals);
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-primary p-4 text-center text-primary-foreground">
        <div><p className="font-display text-2xl font-extrabold text-gold">${s.dollars}</p><p className="text-[11px] opacity-80">est. saved</p></div>
        <div><p className="font-display text-2xl font-extrabold text-gold">{s.hours}h</p><p className="text-[11px] opacity-80">est. time saved</p></div>
        <div><p className="font-display text-2xl font-extrabold text-gold">{data.meals}</p><p className="text-[11px] opacity-80">meals logged</p></div>
      </div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-primary">Your badges</h2>
        <span className="text-xs font-semibold text-muted-foreground">{earned} / {data.badges.length} earned</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {data.badges.map((b) => (
          <div key={b.id} title={b.hint} className={`rounded-2xl border p-3 text-center ${b.earned ? "border-gold/60 bg-secondary" : "bg-card"}`}>
            <div className={`text-3xl ${b.earned ? "" : "opacity-30 grayscale"}`} aria-hidden>{b.icon}</div>
            <p className="mt-1 text-xs font-bold leading-tight text-primary">{b.title}</p>
            {b.earned ? <p className="mt-1 text-[10px] font-semibold text-gold">Earned</p> : (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gold" style={{ width: `${(b.progress / b.goal) * 100}%` }} /></div>
            )}
            {!b.earned && <p className="mt-1 text-[10px] text-muted-foreground">{b.hint}</p>}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">Savings are estimates (about $8 and 15 minutes per home-prepped meal).</p>
    </section>
  );
}
