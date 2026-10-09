<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the free cookbook delivery self-contained: the uploaded PDF asset is the source of truth for instant downloads and email links, with email delivery treated as an additional channel so a provider outage never creates a dead download.
- Product sales pages use a bundled visual story (mockup first, then product-in-use photography) rather than PDF screenshots so the gallery communicates the customer outcome before the document format.
- Keep account recovery on a public TanStack route so reset links can work before the user is signed in.
- Keep customer-facing product previews as public leaf routes under `src/routes`, using `SiteLayout` and bundled, browser-safe assets so they render consistently across hosts.
- Meal Prep System sales are routed by the webhook's `productSlug` into `prep_purchases` (not `cookbook_downloads`); access to the interactive tools is granted only after server-verified payment against that table — never open registration.
- The interactive Meal Prep System lives under `/prep-app/*` (code in `src/prep-kit/`, tables prefixed `prep_`); its layout gate calls a server function that allows admins, admin-gifted `prep_members`, or emails with a `prep_purchases` row, and blocks revoked members — so paid access is decided server-side, never by signup.
- Meal Prep recipes come from a runtime library: the built-in cookbook in code plus admin-managed `prep_cookbooks`/`prep_recipes` (service-role only, read via server functions); the prep-app gate loads it once and mutates RECIPES/RECIPE_BY_ID so every tool shares one list — keeps old saved plans resolvable.

- Public leaf routes use the shared SEO helper for self-referencing metadata and JSON-LD; the root keeps only site-wide defaults to prevent outdated previews from overriding content.
- The sitemap enumerates public content with paginated publishable-key reads and returns an error on failed queries rather than incomplete XML; private downloads and member tools are never listed.
- CSV exports must neutralize spreadsheet formulas before quoting cells so buyer-controlled text cannot execute when opened.
- Public catalog reads expose enabled homepage sections, published content links and referenced media only; staff policies retain full management access.
- Public Paddle price resolution accepts only built-in offers or published catalog prices so it cannot proxy arbitrary provider queries.
- Transactional email sending requires authenticated boss/admin role rows; public free-cookbook signup uses its dedicated delivery handler.
- Reviews without sign-in require a recorded cookbook purchase before any Paddle transaction lookup.
- Public review-photo retrieval requires approved, consented reviews and no caching; moderation uses short-lived signed URLs after staff authorization.
- Media uploads validate encoded size, allowed MIME types and byte signatures before storage; paths use a generated UUID and detected extension.
