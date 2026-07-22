# Phase 1 — Multi-Product Foundation

Turn PrimeDownloads into a scalable digital-product storefront. The current cookbook keeps selling throughout; nothing about the live checkout, webhook, or download flow changes for existing buyers.

## What this phase delivers

- Dynamic `products` and `categories` tables driving the whole site
- New `/shop` (grid + category filter + sort) and `/shop/$slug` (auto-generated premium product page)
- Existing cookbook migrated into `products` as row #1 — homepage still features it, `/thank-you` and email links still work
- Admin: **Products** and **Categories** tabs (boss-only) with full CRUD, image + PDF upload, publish/draft, featured/bestseller flags
- Checkout works for any product, not just the cookbook
- Signed-in purchases attach `userId` to Paddle `customData` so the future Customer Library can attribute purchases

Not in this phase (deferred to later, agreed): Blog, Free Resources email capture, Newsletter section, Customer Library page, requiring accounts at checkout (buyers can still checkout as guests for now — we'll flip that on when Library ships).

## Database (one migration)

**`product_categories`**
- `id`, `slug` (unique), `name`, `description`, `sort_order`, timestamps
- RLS: public SELECT; boss-only write via `has_role`

**`products`**
- `id`, `slug` (unique), `title`, `subtitle`, `description` (long, markdown ok)
- `category_id` FK
- `cover_image_url`, `gallery_urls` (text[]), `pdf_asset_id` (references CDN asset), `bonus_files` (jsonb)
- `price_cents`, `compare_at_cents`, `currency`
- `paddle_price_external_id` (unique, e.g. `high_protein_cookbook_onetime`) — links to Paddle catalog
- `is_featured`, `is_bestseller`, `status` ('draft' | 'published'), `published_at`
- `seo_title`, `seo_description`, `pinterest_description`
- timestamps
- RLS: public SELECT `WHERE status='published'`; boss can SELECT/INSERT/UPDATE/DELETE all
- Grants: `SELECT` to anon+authenticated, `ALL` to service_role

**Migrate existing cookbook**: seed one row with current title, price ($14.99 / $29.99), the existing `paddle_price_external_id`, and the current PDF asset id.

**Storage**: reuse existing `review-photos` bucket pattern; add new public `product-assets` bucket for covers/gallery.

## Server functions (`src/lib/products.functions.ts`)

Public (no auth):
- `listPublishedProducts({ category?, sort?, limit? })`
- `getProductBySlug(slug)`
- `listCategories()`
- `listFeaturedProducts()` / `listBestsellers()`

Boss-only (`requireSupabaseAuth` + `has_role('boss')`):
- `adminListProducts`, `adminCreateProduct`, `adminUpdateProduct`, `adminDeleteProduct`, `adminDuplicateProduct`
- `adminListCategories`, `adminUpsertCategory`, `adminDeleteCategory`

Existing pricing panel keeps working — it now edits the featured cookbook's row instead of the standalone `pricing_settings` table (backed by a compatibility shim so old code paths don't break in one turn).

## Routes

- `src/routes/shop.tsx` — grid, category chips, sort dropdown. Uses TanStack Query loader pattern.
- `src/routes/shop.$slug.tsx` — dynamic product page. Same premium layout blocks as current sales page (hero, gallery, what's inside, guarantee, FAQ, sticky buy button, reviews for that product). `head()` pulls `seo_title` / `seo_description` / cover as `og:image`.
- `src/routes/index.tsx` — hero unchanged; Featured Products + Best Sellers strips now read from `products` table. Existing cookbook still stars.
- `src/routes/_authenticated/admin.tsx` — add **Products** and **Categories** entries to the sidebar; Pricing panel becomes "Cookbook Pricing" alongside a broader "All Products" editor.

## Checkout wiring

`usePaddleCheckout` already takes a `priceId`. Product pages pass that product's `paddle_price_external_id`. Signed-in users get `customData: { userId, product_slug }`; guests just get `product_slug`. Webhook stores `product_slug` on the download/subscriber row so re-download links resolve to the right PDF.

## Reviews scoping

`reviews` gets a nullable `product_id` column. Existing reviews stay associated with the cookbook. Product pages show only reviews for that product; the homepage keeps its aggregate approved-reviews strip.

## Technical notes

- All new tables follow the CREATE → GRANT → RLS → POLICY order.
- All product images use `<img loading="lazy">` + explicit width/height.
- Product `head()` sets recipe/product JSON-LD when relevant fields exist.
- `paddle_price_external_id` on a product row is the only field the admin cannot free-edit — creating a new product requires calling `payments--create_product`, which I'll do from chat when you add each new product (Paddle can't be created from the app UI).

## Verification before I hand back

- `bun run build` clean
- Playwright: `/`, `/shop`, `/shop/high-protein-cookbook` render; admin Products list loads; create-draft flow persists.
- Existing `/thank-you` download for the cookbook still works end-to-end (test transaction id).

Approve and I'll ship it.