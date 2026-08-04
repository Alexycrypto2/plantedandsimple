# PrimeDownloads repair and AI employee workflow

## Goal
Make the public site reliable again, then turn the admin panel into one simple operating loop that needs your decisions—not constant manual management.

```text
Research → Review brief → AI creates campaign → Approve by channel
         → Website / Pinterest / Email publish → Results → AI learns
```

## 1. Repair the public site first
- Fix recipe pages so both current flat recipe data and future grouped recipe data render safely. Missing ingredients, instructions, nutrition, tips, or images must show a valid fallback instead of crashing server rendering.
- Repair the existing recipe’s missing hero image and make every recipe/blog card use a permanent image URL or a polished fallback when no image exists.
- Update the database-powered navigation and footer labels from **Journal** to **Blog**. This is the source still overriding the React labels.
- Add route-level error and not-found states for blog and recipe detail pages so a malformed item can never take down the site.
- Test Home → Blog → article → Recipes → recipe on mobile and desktop, including images and back navigation.

## 2. Make admin access dependable
- Keep `ayubadesina3@gmail.com` as the existing boss account.
- Improve the admin bootstrap so expired sessions prompt a clear sign-in instead of incorrectly saying the boss lacks access.
- Show actionable loading, retry, and authentication error states while preserving the protected admin route.

## 3. Replace scattered creation tools with one campaign workflow
- Make **Campaign Center** the primary creation workspace.
- Start with a topic from Trend Radar, an existing recipe, or a manual idea.
- AI first creates a compact campaign brief: opportunity, audience, angle, keywords, channels, asset plan, CTA, and recommended publishing timing.
- You review and edit that brief once. Full asset generation starts only after approval.
- After brief approval, AI creates the connected recipe/blog, smart image set, five Pinterest variants, email, CTA/product promo, SEO metadata, and quality scores.
- Preserve every asset and relationship in the existing Library/content graph as the single source of truth.

## 4. Simplify approval into three channel lanes
- Replace the mixed item-by-item queue with campaign review grouped into:
  - **Website** — recipe, blog, SEO, internal links, CTA
  - **Pinterest** — five pins, copy, board, tracked destination, schedule
  - **Email** — subject, preview text, body, audience, schedule
- Each lane supports Preview, Edit, Approve, Reject/Regenerate, and Publish/Schedule.
- Show scores and blocking issues beside the relevant channel; do not hide weak content behind an overall score.
- Approving a lane can publish or schedule that channel automatically, matching the selected automation preference.

## 5. Improve automation without losing control
- Website: publish approved recipe/blog content and linked images.
- Pinterest: publish or schedule approved pins through the connected Pinterest account with tracked redirects and UTM parameters.
- Email: schedule approved campaigns through the existing email system, with a final audience and send-time review.
- Failed publishing stays visible with Retry; one channel failure must not block the other approved channels.

## 6. Reduce the panel to the work that matters
- Dashboard becomes **Today**: opportunities found, briefs awaiting review, channels awaiting approval, publishing failures, and recent results.
- Keep: Dashboard, Campaigns, Approval Queue, Library, Recipes, Blogs, Pinterest, Audience, Analytics, Products, Settings.
- Fold Trend Radar and the generic AI Assistant into Campaigns as campaign entry points.
- Remove the duplicate standalone topic finder and duplicate image/content generators from the main navigation; retain image editing only inside an asset/campaign where it has context.
- Keep AI learning and brand rules behind Analytics/Settings instead of presenting them as daily tools.

## 7. Close the learning loop
- Connect campaign and channel IDs to views, Pinterest clicks/CTR, email results, downloads, and revenue.
- Feed those results into the existing learning signals and recommendations.
- Surface the next recommended campaign with a clear reason and supporting metrics; accepting it opens a prefilled campaign brief rather than immediately generating content.

## Technical details
- Normalize recipe shapes at the server boundary and add defensive rendering in detail routes.
- Use the existing permanent private-storage image proxy; backfill only records with missing or obsolete image references.
- Extend the existing `ai_generations`, `email_campaigns`, `content_relations`, `content_schedule`, `pinterest_posts`, and learning tables rather than creating parallel content systems.
- Add campaign brief/channel status fields through a reviewed database migration only where the current JSON payload cannot safely represent workflow state.
- Keep authenticated actions in protected server functions and publishing callbacks in secured public server routes.
- Refactor server-function modules touched by this work into thin wrappers with runtime helpers kept in server-only modules.

## Verification
- Confirm all public content routes return successful responses and render without server errors.
- Confirm the boss can sign in, refresh `/admin`, and retain access.
- Run one complete test campaign: brief approval → asset generation → approve each channel → publish/schedule → verify connected Library records and analytics signals.
- Verify responsive layouts and no overlapping controls at mobile and desktop widths.