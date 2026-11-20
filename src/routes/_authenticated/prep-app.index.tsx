import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, ShoppingBasket, ChefHat, Heart, Check, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { useCurrentPlan, useFavorites, useProfile, useSavePlan } from "@/prep-kit/lib/data";
import { MacroRing } from "@/prep-kit/components/MacroRing";
import { RecipePicker } from "@/prep-kit/components/RecipePicker";
import { RECIPE_BY_ID } from "@/prep-kit/data/content";
import { DAYS, DAY_LABEL, SLOTS, type Day, type PlanSlots, type Slot } from "@/prep-kit/data/types";
import { planRecipeCounts, buildGrocery } from "@/prep-kit/lib/grocery";
import { RecipeCard } from "@/prep-kit/components/RecipeCard";
import { Empty } from "@/prep-kit/components/AppShell";

export const Route = createFileRoute("/_authenticated/prep-app/")({
  head: () => ({ meta: [{ title: "Home — Planted & Simple" }, { name: "description", content: "Your week at a glance." }, { property: "og:title", content: "Home — Planted & Simple" }, { property: "og:description", content: "Your week at a glance." }] }),
  component: Dashboard,
});

const todayKey = (): Day => DAYS[(new Date().getDay() + 6) % 7]!;

/** ISO date (YYYY-MM-DD, local) of the given weekday in the current Mon–Sun week. */
function dateForDay(d: Day): string {
  const now = new Date();
  const diff = DAYS.indexOf(d) - (now.getDay() + 6) % 7;
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}
const eatenKey = (d: Day) => `prep-eaten-${dateForDay(d)}`;

function useEatenWeek() {
  const [eaten, setEaten] = useState<Partial<Record<Day, string[]>>>({});
  useEffect(() => {
    const all: Partial<Record<Day, string[]>> = {};
    for (const d of DAYS) { try { all[d] = JSON.parse(localStorage.getItem(eatenKey(d)) ?? "[]"); } catch { all[d] = []; } }
    setEaten(all);
  }, []);
  const toggle = (d: Day, slot: string) => setEaten((cur) => {
    const list = cur[d] ?? [];
    const next = list.includes(slot) ? list.filter((s) => s !== slot) : [...list, slot];
    try { localStorage.setItem(eatenKey(d), JSON.stringify(next)); } catch { /* storage unavailable */ }
    return { ...cur, [d]: next };
  });
  return { eaten, toggle };
}

function isoDaysAgo(n: number): string {
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() - n);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}
function loggedOn(iso: string): boolean {
  try { return (JSON.parse(localStorage.getItem(`prep-eaten-${iso}`) ?? "[]") as string[]).length > 0; } catch { return false; }
}
/** Consecutive days with at least one meal ticked, counting back from today (or yesterday if today not logged yet). */
function useStreak(dep: unknown) {
  const [state, setState] = useState({ count: 0, today: false });
  useEffect(() => {
    const today = loggedOn(isoDaysAgo(0));
    let n = 0;
    for (let i = today ? 0 : 1; i < 366 && loggedOn(isoDaysAgo(i)); i++) n++;
    setState({ count: n, today });
  }, [dep]);
  return state;
}

function Dashboard() {
  const { eaten, toggle } = useEatenWeek();
  const streak = useStreak(eaten);
  const profile = useProfile();
  const plan = useCurrentPlan();
  const favs = useFavorites();
  const savePlan = useSavePlan();
  const [day, setDay] = useState<Day>(todayKey());
  const [swap, setSwap] = useState<Slot | null>(null);
  if (profile.data && !profile.data.onboarded) return <Navigate to="/prep-app/onboarding" />;

  const slots = plan.data?.slots ?? {};
  const isToday = day === todayKey();
  const dayMeals = slots[day] ?? {};
  const dayEaten = eaten[day] ?? [];
  const counts = planRecipeCounts(slots);
  const meals = [...counts.values()].reduce((a, b) => a + b, 0);
  const grocery = plan.data ? buildGrocery(slots) : [];
  const checked = plan.data?.grocery_checked.length ?? 0;
  const protein = (k: Slot) => (dayMeals[k] ? RECIPE_BY_ID[dayMeals[k]!]?.nutrition.protein ?? 0 : 0);
  const plannedProtein = SLOTS.reduce((s, k) => s + protein(k), 0);
  const plannedKcal = SLOTS.reduce((s, k) => s + (dayMeals[k] ? RECIPE_BY_ID[dayMeals[k]!]?.nutrition.calories ?? 0 : 0), 0);
  const target = profile.data?.protein_target || 100;
  const eatenProtein = SLOTS.reduce((s, k) => s + (dayEaten.includes(k) ? protein(k) : 0), 0);
  const avoid = [...(profile.data?.allergies ?? []), ...(profile.data?.dislikes ?? [])];
  const favList = [...(favs.data ?? [])].map((id) => RECIPE_BY_ID[id]).filter((r): r is NonNullable<typeof r> => !!r).slice(0, 3);

  const doSwap = (slot: Slot, id: string | null) => {
    if (!plan.data) return;
    const next: PlanSlots = { ...slots, [day]: { ...(slots[day] ?? {}), [slot]: id } };
    savePlan.mutate({ id: plan.data.id, slots: next as never }, {
      onSuccess: () => toast.success(id ? "Meal swapped" : "Meal removed"),
      onError: () => toast.error("Couldn't save that change. Please try again."),
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-primary">Hi{profile.data?.display_name ? `, ${profile.data.display_name}` : ""}.</h1>
        <p className="text-muted-foreground">A little planning. A much easier week.</p>
        <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${streak.today ? "border-primary bg-primary text-primary-foreground" : "bg-card text-primary"}`}>
          <span aria-hidden>🔥</span>
          <span className="font-bold">{streak.count > 0 ? `${streak.count}-day streak` : "Start your streak"}</span>
          <span className="opacity-80">· {streak.count === 0 ? "Tick off today's meals to begin" : streak.today ? "Logged today, keep it going!" : "Log today to keep it alive"}</span>
        </div>
      </div>

      {!plan.isLoading && !plan.data ? (
        <Empty title="No plan for this week yet">
          <p>Start from a cookbook week or let us suggest one.</p>
          <Link to="/prep-app/planner" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Plan my week</Link>
        </Empty>
      ) : (
        <>
          <nav aria-label="Choose a day" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {DAYS.map((d) => {
              const planned = SLOTS.filter((k) => slots[d]?.[k]).length;
              const done = planned > 0 && SLOTS.every((k) => !slots[d]?.[k] || (eaten[d] ?? []).includes(k));
              const active = d === day;
              return (
                <button key={d} type="button" onClick={() => setDay(d)} aria-pressed={active}
                  className={`flex min-w-[3.25rem] flex-1 flex-col items-center rounded-xl border px-2 py-2 transition-colors ${active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card text-primary hover:bg-muted"}`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">{d}</span>
                  <span className="font-display text-base font-extrabold">{Number(dateForDay(d).slice(8))}</span>
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full ${done ? (active ? "bg-gold" : "bg-primary") : d === todayKey() && !active ? "bg-gold" : "bg-transparent"}`} />
                </button>
              );
            })}
          </nav>

          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-primary">{isToday ? "Today's meals" : `${DAY_LABEL[day]}'s meals`}</h2>
              <span className="text-xs font-semibold text-muted-foreground">{plannedProtein}g protein · {plannedKcal} kcal planned</span>
            </div>
            <div className="mt-4">
              <MacroRing value={eatenProtein} target={target} label="protein eaten" sub={plannedProtein < target ? `Plan is ${target - plannedProtein}g short — try a swap` : undefined} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {SLOTS.map((s) => {
                const r = dayMeals[s] ? RECIPE_BY_ID[dayMeals[s]!] : null;
                const done = dayEaten.includes(s);
                return r ? (
                  <div key={s} className={`flex items-center gap-2 rounded-xl p-2 ${done ? "bg-secondary" : "bg-muted/60"}`}>
                    <Link to="/prep-app/recipes/$id" params={{ id: r.id }} className="flex min-w-0 flex-1 items-center gap-3">
                      <img src={r.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                      <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s} · {r.nutrition.protein}g</p><p className={`line-clamp-2 text-sm font-semibold text-primary ${done ? "line-through opacity-70" : ""}`}>{r.title}</p></div>
                    </Link>
                    <button type="button" onClick={() => setSwap(s)} aria-label={`Swap ${s}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground hover:text-primary">
                      <Shuffle className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => toggle(day, s)} aria-pressed={done} aria-label={done ? `Unmark ${s} as eaten` : `Mark ${s} as eaten`} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${done ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button key={s} type="button" onClick={() => setSwap(s)} className="rounded-xl border border-dashed p-3 text-left text-sm text-muted-foreground hover:bg-muted"><span className="block text-[11px] font-bold uppercase tracking-wider">{s}</span>Add a meal</button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <Stat to="/prep-app/planner" icon={CalendarDays} label="Meals planned" value={`${meals} / 28`} />
            <Stat to="/prep-app/grocery" icon={ShoppingBasket} label="Grocery items" value={`${checked} / ${grocery.length} ticked`} />
            <Stat to="/prep-app/kitchen" icon={ChefHat} label="Prep day" value={profile.data?.prep_day ?? "Sunday"} />
          </section>
        </>
      )}

      {swap && (
        <RecipePicker open onOpenChange={(o) => !o && setSwap(null)} slot={swap} currentId={dayMeals[swap]} avoid={avoid} onPick={(id) => doSwap(swap, id)} />
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-primary"><Heart className="h-4 w-4 text-gold" /> Your favourites</h2>
          <Link to="/prep-app/recipes" className="text-sm font-semibold text-primary">All recipes →</Link>
        </div>
        {favList.length ? (
          <div className="grid gap-4 sm:grid-cols-3">{favList.map((r) => <RecipeCard key={r.id} r={r} />)}</div>
        ) : (
          <p className="text-sm text-muted-foreground">Tap the heart on any recipe to keep it here.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ to, icon: Icon, label, value }: { to: "/prep-app/planner" | "/prep-app/grocery" | "/prep-app/kitchen"; icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <Link to={to} className="flex items-center gap-4 rounded-2xl border bg-card p-4 hover:shadow-sm">
      <span className="rounded-full bg-secondary p-3 text-primary"><Icon className="h-5 w-5" /></span>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-display font-bold text-primary">{value}</p></div>
    </Link>
  );
}
