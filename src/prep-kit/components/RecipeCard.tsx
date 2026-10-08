import { Link } from "@tanstack/react-router";
import { Heart, Clock, Snowflake } from "lucide-react";
import type { Recipe } from "@/prep-kit/data/types";
import { CATEGORY_LABEL } from "@/prep-kit/data/content";
import { useFavorites, useToggleFavorite } from "@/prep-kit/lib/data";

export function RecipeCard({ r }: { r: Recipe }) {
  const favs = useFavorites();
  const toggle = useToggleFavorite();
  const fav = favs.data?.has(r.id) ?? false;
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link to="/prep-app/recipes/$id" params={{ id: r.id }} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <img src={r.image} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="p-4">
          <p className="eyebrow">{CATEGORY_LABEL[r.category]} · No. {r.num}</p>
          <h3 className="mt-1 line-clamp-2 font-display text-base font-bold leading-snug text-primary">{r.title}</h3>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">{r.nutrition.protein}g protein</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{r.totalMinutes} min</span>
            {r.freezer && <Snowflake className="h-3.5 w-3.5" aria-label="Freezer friendly" />}
          </div>
        </div>
      </Link>
      <button
        onClick={() => toggle.mutate({ id: r.id, on: !fav })}
        className="absolute right-3 top-3 rounded-full bg-card/90 p-2 shadow-sm"
        aria-label={fav ? "Remove from favourites" : "Save to favourites"}
      >
        <Heart className={`h-4 w-4 ${fav ? "fill-gold text-gold" : "text-primary"}`} />
      </button>
    </div>
  );
}
