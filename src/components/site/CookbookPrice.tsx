import { useQuery } from "@tanstack/react-query";
import { getPublicPricing } from "@/lib/pricing.functions";

/** Live cookbook price from Admin settings, so every page shows the same amount. */
export function useCookbookPricing() {
  return useQuery({ queryKey: ["public-pricing"], queryFn: () => getPublicPricing(), staleTime: 60_000 }).data;
}

export function CookbookPrice({ compare = false }: { compare?: boolean }) {
  const p = useCookbookPricing();
  if (!p) return <span className="inline-block w-10" aria-hidden="true">&nbsp;</span>;
  return <>${compare ? p.compare_at_display : p.price_display}</>;
}
