# Scalable Cookbook Platform — Phased Build

Locked in: no homepage redesign, no visual changes. Everything below is admin + data + wiring so you manage the site from `/admin` without touching code.

## Phase 1 — Core Platform (this build)

### 1. Admin Dashboard Overview
New default tab at `/admin` → **Overview** with live counters + recent activity:
- Total products (published / draft)
- Total orders (Paddle transactions from `cookbook_downloads`)
- Revenue (sum of order amounts, last 30d + all-time)
- Customers (unique buyer emails)
- Email subscribers (from `subscribers`)
- Recent sales (last 10 orders — email, product, amount, date)
- Recent downloads (last 10 secure downloads)

All powered by one server fn `getDashboardStats` (boss-only, RLS-safe).

### 2. Products CMS (fully DB-driven)
Extends the existing `products` table — no new hardcoded product anywhere.

New/expanded admin form (`/admin` → Products → Add/Edit):
- Cover image upload → `product-assets` bucket (new public bucket)
- Gallery images (multi-upload) → same bucket
- PDF upload → `product-files` bucket (new private bucket, signed URLs on download)
- Title, subtitle, description (textarea, markdown-friendly)
- Benefits (string list) + Features (string list) — stored as `benefits jsonb`, `features jsonb`
- Category dropdown (from `product_categories`)
- Tags (string list) → new `tags text[]` column + GIN index
- Price + compare-at price (cents)
- Best Seller / Featured toggles
- Status: Draft / Published

Every consumer surface reads from `listPublishedProducts` (already exists) — no page needs editing when you publish:
- Homepage Featured strip → `is_featured = true`
- Homepage Best Sellers strip → `is_bestseller = true`
- `/shop` grid → all published
- `/shop/$slug` related products → same category, exclude self
- Search results (Phase 2) → same query + text filter
- Category pages (Phase 2) → filtered by category

Homepage currently references the cookbook in a few hardcoded spots — this build replaces those with `listFeaturedProducts()` / `listBestsellers()` calls, keeping the exact same visual cards.

**Paddle note:** each new product still needs a Paddle price created from chat (`payments--create_product`) — Paddle can't be created from your admin. The admin form has a `paddle_price_external_id` field you paste once. I'll create it for you whenever you add a product.

### 3. Blog CMS
New `blog_posts` table:
- slug, title, excerpt, content (rich HTML), featured_image_url
- category, tags[], seo_title, seo_description
- status (draft/published), published_at, author_id
- RLS: public SELECT where published; boss full CRUD

Admin → **Blog** tab: list, create, edit, delete, publish/draft toggle. Rich text editor via `@tiptap/react` (headings, bold, italic, lists, links, images, blockquote).

`/blog` route swaps its placeholder cards for a live grid of newest published posts. New `/blog/$slug` route renders the post with SEO head + related links. Categories/tags render as filter chips (Phase 2 makes them clickable filters; Phase 1 just displays them).

### 4. Email Capture (real lead magnet)
`/free` form becomes production-ready:
1. Visitor enters email
2. Server fn `subscribeAndSendFreeGuide` inserts into `subscribers` (source=`free_guide`), dedupes on email
3. Enqueues a new transactional email template `free-recipe-guide` with a signed download link (24h expiry) to the free-guide PDF in `product-files`
4. Redirects to `/free/thank-you` (new mini page) confirming delivery
5. Subscriber row is now visible in admin **Subscribers** tab (already exists — I'll wire the source column)

You upload the free-guide PDF once via admin (new "Free Resources" mini-section) so it's swappable without code.

---

## Phase 2 (next approval)
Search bar in nav, category landing pages (`/shop/category/$slug`), tag pages, filter sidebar on `/shop` (price, category, tag, sort), curated recipe collections table + admin, dynamic Related Products by shared tags.

## Phase 3 (later approval)
Customer accounts + `/library` (re-download purchases tied to `user_id` on orders), purchase history, coupon codes (`coupons` table + Paddle discount sync), extend existing affiliate system with per-affiliate coupon codes and referral analytics.

---

## Technical notes
- Migration order per table: CREATE → GRANT → ENABLE RLS → POLICY.
- New buckets via `supabase--storage_create_bucket` — `product-assets` (public), `product-files` (private, signed URLs only).
- All admin writes go through `requireSupabaseAuth` + `has_role('boss')` — matches existing pattern in `products.functions.ts`.
- New columns on `products`: `tags text[] default '{}'`, `benefits jsonb default '[]'`, `features jsonb default '[]'`.
- Dashboard stats: one server fn returning all counters in a single round-trip.
- Existing cookbook row keeps working; the Paddle webhook and `/thank-you` flow are untouched.
- Zero homepage visual changes — only the data source for the Featured/Bestsellers strips swaps to the DB query.

## Verification before handoff
- `bun run build` clean
- Playwright: `/admin` Overview loads with real numbers, create-draft-then-publish flow makes the product show on `/shop` and homepage Featured, `/blog` renders a seeded published post, `/free` email submit creates a subscriber + enqueues the email
- Existing `/thank-you` cookbook download still works with a test transaction id

Approve Phase 1 and I'll ship it in one pass.