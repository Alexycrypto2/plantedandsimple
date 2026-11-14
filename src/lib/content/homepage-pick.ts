/** A blog post is pinned to the homepage by a reserved "homepage" tag (hidden from editors' tag box). */
export const HOMEPAGE_TAG = "homepage";
const split = (t: string) => t.split(",").map((x) => x.trim()).filter(Boolean);
export const hasHomepageTag = (tags: string) => split(tags).some((x) => x.toLowerCase() === HOMEPAGE_TAG);
export const stripHomepageTag = (tags: string) => split(tags).filter((x) => x.toLowerCase() !== HOMEPAGE_TAG).join(", ");
export const toggleHomepageTag = (tags: string, on: boolean) => {
  const rest = split(stripHomepageTag(tags));
  return (on ? [...rest, HOMEPAGE_TAG] : rest).join(", ");
};
/** Pinned posts first (newest first within each group), then the rest by date. */
export function homepageOrder<T extends { tags?: string[] | null; published_at?: string | null }>(posts: T[]): T[] {
  const pinned = (p: T) => (p.tags ?? []).some((t) => t.toLowerCase() === HOMEPAGE_TAG);
  return [...posts].sort((a, b) => Number(pinned(b)) - Number(pinned(a)) || String(b.published_at ?? "").localeCompare(String(a.published_at ?? "")));
}

export function homepageShelf<T extends { status?: string; tags?: string[] | null; published_at?: string | null }>(posts: T[], limit = 3): T[] {
  return homepageOrder(posts.filter((p) => !p.status || p.status === "published")).slice(0, limit);
}
