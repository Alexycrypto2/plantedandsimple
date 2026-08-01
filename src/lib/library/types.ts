export type ContentType = "recipe" | "blog" | "product" | "pin" | "collection";

export type MediaItem = {
  id: string;
  storage_path: string | null;
  public_url: string;
  alt: string;
  title: string | null;
  width: number | null;
  height: number | null;
  tags: string[];
  created_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_id: string | null;
  image_url?: string | null;
  parent_id: string | null;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_id: string | null;
  image_url?: string | null;
  is_featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
};

export type RecipeIngredient = { group?: string | null; items: string[] };
export type RecipeStep = { title?: string | null; body: string };
export type NutritionRow = { label: string; value: string };

export type Recipe = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  hero_image_id: string | null;
  hero_image_url: string | null;
  gallery_ids: string[];
  gallery_urls: string[];
  ingredients: RecipeIngredient[];
  instructions: RecipeStep[];
  nutrition: NutritionRow[];
  tips: string[];
  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: string | null;
  difficulty: string;
  tags: string[];
  pinterest_description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: "draft" | "published";
  is_featured: boolean;
  published_at: string | null;
  created_at?: string;
  categories?: Array<{ id: string; slug: string; name: string }>;
};

export type HomepageSection = {
  id: string;
  kind: string;
  title: string | null;
  subtitle: string | null;
  config: Record<string, any>;
  sort_order: number;
  enabled: boolean;
};

export type SearchHit = {
  type: ContentType;
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
};

export const DEFAULT_NAV = [
  { label: "Shop", href: "/shop" },
  { label: "Recipes", href: "/recipes" },
  { label: "Journal", href: "/blog" },
  { label: "Free Guide", href: "/free" },
  { label: "About", href: "/about" },
];

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}