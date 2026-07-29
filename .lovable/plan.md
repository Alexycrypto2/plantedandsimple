# PrimeDownloads AI Studio & Automation Platform

This is a large build. I'll ship it in **approved phases**, each independently usable. You approve, I build, we verify, then move to the next. No phase blocks the site from working.

## Guiding principles
- **Approval Queue is mandatory** — nothing AI-generated auto-publishes. Every asset lands in `ai_generations` with status `pending` and needs a human click to go live.
- **Modular AI provider layer** — one `src/lib/ai/` module wraps the AI gateway (GPT-5.6 for text, Gemini image for images). Swappable without touching feature code.
- **DB-driven, no hardcoding** — homepage, shop, blog, categories all read from Supabase.
- **Server-only secrets** — Pinterest tokens, AI keys stay server-side.

---

## Phase 1 — Foundation (schema + approval queue + AI provider layer)

New tables (one migration, RLS + grants):
- `ai_generations` — universal approval queue: `id, kind (blog|image|pinterest_pin|email|product_desc|social), title, payload jsonb, preview_url, model, topic, seo_score, quality_score, status (pending|approved|rejected|published), created_by, created_at, decided_at, scheduled_for`.
- `ai_topics` — trending topic cache: `topic, category, search_volume, competition, trend_score, pinterest_score, seasonal_score, ai_score, recommendation, discovered_at`.
- `pinterest_accounts` — encrypted OAuth tokens.
- `pinterest_pins` — pin records with schedule/publish state.
- `email_campaigns` — campaigns + automation definitions.
- `content_schedule` — unified calendar.
- `analytics_events` — view/click/save counts.

Code:
- `src/lib/ai/gateway.ts` — provider abstraction (`generateText`, `generateImage`, `generateJson`).
- `src/lib/ai/approval.functions.ts` — CRUD for `ai_generations`: list, approve, reject, regenerate, edit, bulk actions.
- Admin **Approval Queue** page with tabs per kind, preview, approve/reject/edit/schedule.

## Phase 2 — AI Studio: Blog Generator + Image Studio
- `/admin/ai-studio` with tabs.
- **Blog Generator:** topic + word count + tone → title, slug, excerpt, markdown, SEO, tags, FAQs, JSON-LD, Pinterest fields → into `ai_generations` (kind=blog). On approve, upserts into `blog_posts` as draft.
- **Image Studio:** presets (Blog Hero, Pinterest 1000x1500, Instagram, Facebook, Cookbook promo). Brand-styled prompts, Gemini image model, uploads to `ai-images` bucket, result → `ai_generations` (kind=image).

## Phase 3 — Trending Topics + AI Assistant
- **Trending Topics:** GPT scores N topics for selected categories, upserts to `ai_topics`. Filter chips. "Write Now" pipes topic into Blog Generator.
- **AI Assistant:** admin chat panel. Server fn streams from gateway with system prompt describing commands (find topics, generate blog, rewrite, SEO improve, etc.).

## Phase 4 — Pinterest OAuth + Pinterest Studio

**Redirect URI to paste into Pinterest Developer dashboard (production):**
```
https://primedownloads.store/api/public/pinterest/oauth/callback
```
Add the preview URL as a second redirect for testing:
```
https://project--52b53015-fb2e-4297-a919-f0cb70f5a6d0.lovable.app/api/public/pinterest/oauth/callback
```

Setup:
- I'll request two secrets via `add_secret`: `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`.
- Server routes: `/api/public/pinterest/oauth/start` (boss-only, signed state) → Pinterest authorize; `/api/public/pinterest/oauth/callback` → exchanges code, encrypts + stores tokens in `pinterest_accounts`.
- Auto-refresh when `expires_at` < 5 min away.
- Admin **Integrations → Pinterest** page: status, connected username, redirect URI (copy button), Connect / Reconnect / Disconnect.

Pinterest Studio:
- Generate pin (image + title + description + hashtags + alt) → approval queue.
- On approve: pick board, schedule or publish now → `POST /v5/pins`.
- Analytics pull (impressions/saves/clicks) into `analytics_events`.

## Phase 5 — Content Calendar + Email Marketing + Analytics + SEO Center
- **Calendar:** month view from `content_schedule`, drag-drop reschedules. `/api/public/scheduler/tick` (pg_cron every 5 min) publishes items whose time has come and status = approved.
- **Email Marketing:** subscribers, segments, campaign builder on the existing email queue, automation sequences (free_guide → welcome → tips → cookbook → discount).
- **Analytics:** widgets from `analytics_events` + existing tables. `/api/public/track` beacon on public pages.
- **SEO Center:** scans `blog_posts` & `products` for missing meta/alt, checks sitemap/robots, computes SEO Health Score, suggests internal links.

## Phase 6 — Dashboard revamp
Overview shows every metric requested: revenue, orders, products, blogs, pins, subscribers, visitors, conversion, best sellers, best blog, best pin, recent activity, scheduled content, AI recommendations, today's AI suggestions.

---

## Technical notes
- AI: Lovable AI Gateway via `@ai-sdk/openai-compatible`, default `openai/gpt-5.6-sol` with `reasoningEffort: "none"`. Image: `google/gemini-3.1-flash-image`.
- Pinterest scopes: `boards:read pins:read pins:write user_accounts:read`.
- Token storage: AES-256-GCM ciphertext, key auto-generated as `APP_SECRET`.
- RLS on every new table; boss role for admin ops via `has_role`.
- No new edge functions — TanStack server fns / server routes only.

---

## What I need from you

1. **Approve this plan** (or tell me to trim / reorder).
2. After approval I'll build **Phase 1 + Phase 2** in one pass so you can try the approval queue, blog generator, and image studio immediately.
3. When you're ready for Pinterest, I'll wire OAuth and ask for `PINTEREST_APP_ID` / `PINTEREST_APP_SECRET`. Add the redirect URI above to your Pinterest app now so it's ready.