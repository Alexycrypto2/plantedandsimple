import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { CalendarDays, ShoppingBasket, ChefHat, Heart } from "lucide-react";
import { useCurrentPlan, useFavorites, useProfile } from "@/prep-kit/lib/data";
import { RECIPE_BY_ID } from "@/prep-kit/data/content";
import { DAYS, SLOTS, type Day } from "@/prep-kit/data/types";
import { planRecipeCounts, buildGrocery } from "@/prep-kit/lib/grocery";
import { RecipeCard } from "@/prep-kit/components/RecipeCard";
import { Empty } from "@/prep-kit/components/AppShell";

export const Route = createFileRoute("/_authenticated/prep-app/")({
  head: () => ({ meta: [{ title: "Home — Planted & Simple" }, { name: "description", content: "Your week at a glance." }, { property: "og:title", content: "Home — Planted & Simple" }, { property: "og:description", content: "Your week at a glance." }] }),
  component: Dashboard,
});

const todayKey = (): Day => DAYS[(new Date().getDay() + 6) % 7]!;

function Dashboard() {
  const profile = useProfile();
  const plan = useCurrentPlan();
  const favs = useFavorites();
  if (profile.data && !profile.data.onboarded) return <Navigate to="/prep-app/onboarding" />;

  const slots = plan.data?.slots ?? {};
  const today = slots[todayKey()] ?? {};
  const counts = planRecipeCounts(slots);
  const meals = [...counts.values()].reduce((a, b) => a + b, 0);
  const grocery = plan.data ? buildGrocery(slots) : [];
  const checked = plan.data?.grocery_checked.length ?? 0;
  const todayProtein = SLOTS.reduce((s, k) => s + (today[k] ? RECIPE_BY_ID[today[k]!]?.nutrition.protein ?? 0 : 0), 0);
  const favList = [...(favs.data ?? [])].map((id) => RECIPE_BY_ID[id]).filter((r): r is NonNullable<typeof r> => !!r).slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-primary">Hi{profile.data?.display_name ? `, ${profile.data.display_name}` : ""}.</h1>
        <p className="text-muted-foreground">A little planning. A much easier week.</p>
      </div>

      {!plan.isLoading && !plan.data ? (
        <Empty title="No plan for this week yet">
          <p>Start from a cookbook week or let us suggest one.</p>
          <Link to="/prep-app/planner" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Plan my week</Link>
        </Empty>
      ) : (
        <>
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-primary">Today's meals</h2>
              <span className="text-sm font-semibold text-gold">{todayProtein}g protein</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SLOTS.map((s) => {
                const r = today[s] ? RECIPE_BY_ID[today[s]!] : null;
                return r ? (
                  <Link key={s} to="/prep-app/recipes/$id" params={{ id: r.id }} className="flex items-center gap-3 rounded-xl bg-muted/60 p-2">
                    <img src={r.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s}</p><p className="line-clamp-2 text-sm font-semibold text-primary">{r.title}</p></div>
                  </Link>
                ) : (
                  <Link key={s} to="/prep-app/planner" className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground"><span className="block text-[11px] font-bold uppercase tracking-wider">{s}</span>Add a meal</Link>
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

function Stat({ to, icon: Icon, label, value }: { to: "/prep-app/planner" | "/grocery" | "/prep"; icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <Link to={to} className="flex items-center gap-4 rounded-2xl border bg-card p-4 hover:shadow-sm">
      <span className="rounded-full bg-secondary p-3 text-primary"><Icon className="h-5 w-5" /></span>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-display font-bold text-primary">{value}</p></div>
    </Link>
  );
}
