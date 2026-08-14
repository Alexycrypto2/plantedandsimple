# Cookbook delivery, recipes, checkout, AI images, and live pricing

## Goal
Complete the free-cookbook subscriber journey, publish five complete recipes, make product pricing update consistently, and repair checkout and image-generation behavior with clear diagnostics.

## Implementation

### 1. Free cookbook signup and confirmation email
- Replace the current placeholder download URL with the uploaded **20-Minute Plant Protein Kitchen** PDF asset.
- Make one server-side signup action validate the email, upsert the subscriber, record the download request, and enqueue a branded confirmation email with an idempotency key so retries cannot send duplicates.
- Add a dedicated free-cookbook email template with an immediate `/free-cookbook` download link and clear delivery status on the signup form.
- Build `/free-cookbook` as the polished download page: cookbook preview, prominent PDF download button, what is included, and a restrained premium-cookbook upgrade section.
- Keep `/free` as the opt-in page and route successful submissions to `/free-cookbook` while also confirming that the link was emailed.
- Add a responsive newsletter modal at the shared site-layout level, using the same signup action. Show it once after an intentional delay, suppress it after signup/dismissal, and avoid showing it on checkout, thank-you, auth, admin, or free-cookbook pages.

### 2. Email delivery prerequisite
- The app email domain currently failed verification. Code and queueing can be completed and tested, but external delivery starts only after the exact DNS records shown in Project Settings → Email are corrected and setup is retried.
- Verify queue insertion, idempotency, suppression handling, and the branded link without exposing recipient data.

### 3. Five complete recipe records
- Add five original, fully structured recipes: smoky peanut tofu noodles, black bean tacos, red lentil dahl, harissa chickpea bowl, and tempeh breakfast scramble.
- Use the available editorial food photos, add them to the media library, and connect each as its recipe hero image.
- Include grouped ingredients, numbered instructions, prep/cook time, servings, nutrition, tips, tags, Pinterest copy, SEO title, SEO description, featured status, and publication date.
- Seed through an idempotent database migration so the records are reproducible and do not duplicate on reruns.
- Verify the recipe index, recipe detail pages, and homepage recipe grid on desktop and mobile.

### 4. Dynamic product pricing
- Remove the split source of truth between `pricing_settings` and the cookbook product row.
- When the boss updates the main price, update the matching published product record and the Paddle price in both test and live environments; return a visible per-environment sync result instead of silently accepting a partial failure.
- Make public product pages, homepage cards, shop listings, sticky purchase bar, and checkout all read the same product price record.
- Preserve the human-readable Paddle price ID and verify the actual checkout amount against the displayed amount.
- Set the requested cookbook price to **$9.99** while retaining the configured compare-at price, then confirm both test and live catalogs report $9.99.

### 5. Paddle root-cause repair and verification
- Harden price resolution so failed provider responses include the real status/code instead of becoming a generic “price not found” message.
- Verify the full live path: product CTA → `/checkout` → resolved live price → inline checkout initialization → success URL → signed webhook → gated download.
- Confirm go-live status, registered webhook destination/events, current live price, and recent transaction/webhook failures.
- Browser-verify that checkout opens with the correct item and amount. Cross-origin payment fields cannot be automatically completed, so the final real payment submission remains a manual provider step.

### 6. AI image generation without hidden defaults
- Remove hardcoded fallback image model constants and require an explicit saved image model selected from the live Gemini model catalog.
- Add capability validation before generation and show the exact provider response, model, status, and quota explanation when a request fails.
- Keep all image features on the same selected configuration so Image Studio, Pin Studio, and other generators cannot silently use different models.
- A `429` with quota limit `0` cannot be bypassed in code or made “free”; the repair will prevent wasting requests and guide selection to a model the configured Gemini account currently allows. If no image-capable model has quota, generation remains unavailable until quota/billing is enabled on that account.

## Technical details
- Keep public signup input validated server-side and email sending queued with suppression and unsubscribe safeguards.
- Keep email and AI secrets server-only.
- Use existing semantic design tokens and shared page components.
- Keep server-function files thin by moving runtime helpers/constants into server-only modules.
- Add route-specific SEO metadata for `/free-cookbook` and preserve existing route metadata.

## Verification
- Run focused tests for signup idempotency, recipe mapping, pricing synchronization, and Paddle price resolution.
- Inspect database records for five published recipes, their media links, the $9.99 product price, and queued confirmation email.
- Check test and live Paddle catalogs, then open checkout in the preview and published site.
- Test `/free`, `/free-cookbook`, newsletter modal dismissal/signup, recipe pages, shop pages, and mobile layout with browser screenshots.
- Confirm AI image generation either succeeds with the explicitly selected model or returns the exact actionable quota/capability error without retry loops.
