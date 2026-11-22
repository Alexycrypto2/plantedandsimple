import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useCurrentPlan, useFavorites, useProfile, useUser } from "@/prep-kit/lib/data";
import { BadgeShelf } from "@/prep-kit/components/BadgeShelf";
import { planRecipeCounts, buildGrocery } from "@/prep-kit/lib/grocery";
import { buildPrepPlan } from "@/prep-kit/lib/prep";
import { ProfileForm, GOALS } from "./prep-app.onboarding";

export const Route = createFileRoute("/_authenticated/prep-app/profile")({
  head: () => ({ meta: [{ title: "Profile — Planted & Simple" }, { name: "description", content: "Your preferences." }, { property: "og:title", content: "Profile — Planted & Simple" }, { property: "og:description", content: "Your preferences." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const profile = useProfile();
  const user = useUser();
  const p = profile.data;
  const name = p?.display_name || user.data?.email?.split("@")[0] || "Member";
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const since = p?.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : null;
  const plan = useCurrentPlan();
  const favs = useFavorites();
  const slots = plan.data?.slots ?? {};
  const planned = [...planRecipeCounts(slots).values()].reduce((a, b) => a + b, 0);
  const groceryN = plan.data ? buildGrocery(slots).length : 0;
  const prepN = plan.data ? buildPrepPlan(slots, 1).tasks.length : 0;
  const goal = GOALS.find((g) => g.v === p?.goal);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gold font-display text-2xl font-extrabold text-primary ring-4 ring-primary-foreground/20">{initials}</div>
          <div className="min-w-0">
            <p className="truncate font-display text-2xl font-extrabold">{name}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-semibold"><Star className="h-3 w-3 fill-current text-gold" /> Lifetime Prep Member</span>
            {since && <p className="mt-1 text-xs text-primary-foreground/70">Member since {since}</p>}
          </div>
        </div>
        {p && (
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-primary-foreground/10 py-2"><p className="font-display text-lg font-extrabold">{p.protein_target}g</p><p className="text-[11px] text-primary-foreground/70">protein / day</p></div>
            <div className="rounded-xl bg-primary-foreground/10 py-2"><p className="font-display text-lg font-extrabold">{p.servings}</p><p className="text-[11px] text-primary-foreground/70">{p.servings === 1 ? "person" : "people"}</p></div>
            <div className="rounded-xl bg-primary-foreground/10 py-2"><p className="font-display text-lg font-extrabold">{goal?.e ?? "🌱"}</p><p className="truncate px-1 text-[11px] text-primary-foreground/70">{goal?.l ?? "Your goal"}</p></div>
          </div>
        )}
      </div>
      <div className="mb-6"><BadgeShelf input={{ plannedMeals: planned, prepComplete: prepN > 0 && (plan.data?.prep_done.length ?? 0) >= prepN, groceryComplete: groceryN > 0 && (plan.data?.grocery_checked.length ?? 0) >= groceryN, favourites: favs.data?.size ?? 0 }} /></div>
      <p className="eyebrow mb-3">Your preferences</p>
      <ProfileForm submitLabel="Save changes" />
    </div>
  );
}
