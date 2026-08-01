# Phase 1 — Connected Content Platform Foundation

Goal: turn PrimeDownloads into one connected library (products, recipes, blogs, collections, categories, media, pins) with a premium editorial frontend and a redesigned admin. No new AI generation work — existing AI Studio, Approval Queue and Pinterest stay intact and get wired into the new library.

## 1. Database: one source of truth

New tables (all with GRANTs + RLS: public read of published rows, boss/admin write):

- `categories` — universal, shared by every content type (`slug`, `name`, `description`, `image_id`, `parent_id`, `sort_order`).
- `collections` — curated groupings shown on the homepage (`slug`, `name`, `description`, `image_id`, `is_featured`, `sort_order`).
- `media` — central image library (`storage_path`, `public_url`, `alt`, `width`, `height`, `tags`). Every content type references media by id, so updating an image updates it everywhere.
- `recipes` — real recipe CMS: title, slug, description, hero image, gallery, ingredients (jsonb), instructions (jsonb), prep/cook time, servings, difficulty, nutrition, tips, pinterest description, SEO fields, status, featured.
- Join tables for relationships: `content_categories`, `content_collections`, `content_relations` (generic `from_type/from_id → to_type/to_id`), so recipes ↔ blogs ↔ products ↔ pins all link both ways without duplication.
- `homepage_sections` — modular homepage: `kind`, `title`, `subtitle`, `config` (jsonb), `sort_order`, `enabled`.
- `site_settings` — editable trust badges, "Why choose us" cards, footer columns, socials, nav menus.

Existing `products`, `blog_posts`, `pinterest_pins`, `ai_generations` are extended (media ids, relation support), not replaced.

## 2. Data layer

- `src/lib/library/*.functions.ts` — one module per entity (recipes, collections, categories, media, homepage, settings) with public read fns (publishable client, published rows only) and boss-only write fns behind `requireSupabaseAuth`.
- A shared `relations` helper so any entity can read/write its related items with one call.
- Universal search server fn across recipes, blogs, products, collections.

## 3. Frontend redesign (editorial luxury)

- Design tokens in `src/styles.css`: cream, warm white, forest green, charcoal, warm gold; serif display + clean sans; soft shadows, generous spacing, expensive easing.
- Shared primitives: `Reveal` (fade/slide on scroll), `EditorialCard`, `MediaImage` (lazy, responsive, from media library), `SectionHeader`.
- Header: sticky, minimal, logo + nav + search + account, full-screen mobile menu.
- Footer: multi-column nav, legal, socials, newsletter.
- Homepage renders `homepage_sections` in admin-defined order: hero, trust row, featured collections, featured products, latest recipes, latest blogs, why-choose-us, newsletter.
- New routes: `/recipes` (index + filters), `/recipes/$slug`, `/collections/$slug`, `/search`. Shop, product, blog pages restyled to the same system, keeping all existing sales/CTA/review logic.
- SEO per route: title, description, OG, Twitter, canonical, JSON-LD (Recipe / Article / Product / FAQ).

## 4. Admin redesign

Sidebar app shell with sections: Overview, Products, Recipes, Blogs, Collections, Categories, Media, Homepage Builder, Menus & Settings, Users, Analytics, plus existing AI Studio, Pinterest Studio and Approval Queue moved in unchanged.

- Every CMS screen: list + rich editor with relationship pickers (related recipes/blogs/products/collections/categories) and a media picker.
- Homepage Builder: drag to reorder, enable/disable, edit copy and pick featured items.
- Media library: upload, alt text, reuse anywhere.

## 5. Sequencing

1. Migration + data layer
2. Design system + header/footer + homepage sections rendering
3. Recipe CMS + public recipe pages
4. Collections/categories/search + blog & product page restyle
5. Admin shell redesign + all CMS screens + homepage builder

## Technical notes

- Public reads go through the server publishable client with narrow anon SELECT policies on published rows; all writes are boss-gated server functions.
- Relationships use join tables only — no duplicated titles, images or copy anywhere.
- Media stored in a public `media` bucket for fast CDN delivery; existing private `ai-images` bucket keeps working.
- Existing Approval Queue publishing targets gain "recipe" alongside blog and pin, so Phase 2 AI writes into the same library.
