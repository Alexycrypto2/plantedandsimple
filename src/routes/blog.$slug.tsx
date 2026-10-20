import { pageHead, pageUrl, plainDescription, jsonLd, breadcrumbs, absoluteImage } from "@/lib/seo";
import { createFileRoute, Link, notFound, redirect, useRouter } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { ContentEndFunnel } from "@/components/site/ContentEndFunnel";
import { NewsletterPopup } from "@/components/NewsletterPopup";
import { fallbackPost, fallbackRecipe } from "@/lib/fallback-content";
import { getPublishedPostBySlug, type PublicPost } from "@/lib/blog.functions";
import { getRecipeBySlug } from "@/lib/library/library.functions";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  loader: async ({ params }): Promise<{ post: PublicPost }> => {
    let post: PublicPost | null = null;
    try { post = await getPublishedPostBySlug({ data: { slug: params.slug } }); } catch { post = null; }
    if (!post) post = fallbackPost(params.slug);
    if (!post) {
      // Safety net: recipe links pinned under /blog/ get a permanent redirect instead of a 404.
      let recipe: unknown = null;
      try { recipe = await getRecipeBySlug({ data: { slug: params.slug } }); } catch { recipe = null; }
      if (recipe || fallbackRecipe(params.slug)) throw redirect({ to: "/recipes/$slug", params: { slug: params.slug }, statusCode: 301 });
      throw notFound();
    }
    return { post };
  },
  errorComponent: BlogError,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl italic text-forest-deep">Article not found</h1>
        <Link to="/blog" className="mt-6 inline-block text-forest underline">
          Back to The Blog
        </Link>
      </div>
    </SiteLayout>
  ),
  head: ({ loaderData, params }) => {
    const post = loaderData?.post;
    const path = `/blog/${encodeURIComponent(params.slug)}`;
    const title = post?.seo_title?.trim() || `${post?.title ?? "Article not found"} — PlantedAndSimple`;
    const description = plainDescription(post?.seo_description?.trim() || post?.excerpt || "Plant-based cooking inspiration from PlantedAndSimple.");
    const head = pageHead(path, title, description, "article");
    if (!post) return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
    const image = absoluteImage(post.featured_image_url);
    return {
      ...head,
      meta: [...head.meta, ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : [])],
      scripts: [jsonLd({
        "@context": "https://schema.org", "@type": "BlogPosting",
        headline: post.title, description, image,
        datePublished: post.published_at || undefined,
        mainEntityOfPage: pageUrl(path),
        publisher: { "@type": "Organization", name: "PlantedAndSimple", url: pageUrl("/") },
      }), breadcrumbs("Blog", "/blog", post.title, path)],
    };
  },
});

function BlogError({ error, reset }: { error: unknown; reset: () => void }) {
  const router = useRouter();
  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl italic text-forest-deep">We couldn&apos;t open this article</h1>
        <p className="mt-4 text-charcoal/60">Try again, or return to the Blog without losing your place on the site.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => { void router.invalidate(); reset(); }} className="rounded-full bg-forest px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-cream">Try again</button>
          <Link to="/blog" className="rounded-full border border-forest/20 px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-forest">Back to Blog</Link>
        </div>
        <p className="sr-only">{error instanceof Error ? error.message : String(error)}</p>
      </section>
    </SiteLayout>
  );
}

function PostPage() {
  const { post } = Route.useLoaderData() as { post: PublicPost };
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/blog" className="text-xs font-bold uppercase tracking-[0.25em] text-forest/70 hover:text-forest">
          ← The Blog
        </Link>
        {post.category && (
          <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-sage">{post.category}</p>
        )}
        <h1 className="mt-3 font-display text-4xl italic text-forest-deep md:text-5xl">{post.title}</h1>
        {post.published_at && (
          <p className="mt-3 text-xs text-charcoal/50">
            {new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
        {post.featured_image_url && (
          <div className="mt-10 overflow-hidden rounded-[2rem] bg-cream-warm">
            <img src={post.featured_image_url} alt={post.title} className="h-full w-full object-cover" />
          </div>
        )}
        {post.excerpt && (
          <p className="mt-10 font-display text-xl italic text-forest-deep md:text-2xl">{post.excerpt}</p>
        )}
        {(() => {
          const [first, second] = splitArticle(post.content ?? "");
          return (
            <>
              <div className="article-body mt-10" dangerouslySetInnerHTML={{ __html: first }} />
              {second ? <MidArticleBridge /> : null}
              {second ? <div className="article-body" dangerouslySetInnerHTML={{ __html: second }} /> : null}
            </>
          );
        })()}
        {(post.tags ?? []).length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2">
            {(post.tags ?? []).map((t) => (
              <span key={t} className="rounded-full border border-forest/20 px-3 py-1 text-xs text-charcoal/70">
                #{t}
              </span>
            ))}
          </div>
        )}
        <ContentEndFunnel source="blog" />
        <NewsletterPopup />
      </article>
    </SiteLayout>
  );
}
function splitArticle(html: string): [string, string] {
  const closes: number[] = [];
  const re = /<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) closes.push(m.index + m[0].length);
  if (closes.length < 4) return [html, ""];
  const target = html.length / 2;
  let cut = closes[0];
  for (const c of closes) if (Math.abs(c - target) < Math.abs(cut - target)) cut = c;
  // Never cut inside a list, table or blockquote.
  const before = html.slice(0, cut).toLowerCase();
  for (const tag of ["ul", "ol", "table", "blockquote", "div"]) {
    if ((before.match(new RegExp(`<${tag}[\\s>]`, "g")) ?? []).length !== (before.match(new RegExp(`</${tag}>`, "g")) ?? []).length) return [html, ""];
  }
  return [html.slice(0, cut), html.slice(cut)];
}

function MidArticleBridge() {
  return (
    <aside aria-label="Get the cookbook" className="my-10 rounded-2xl border border-forest/15 border-l-4 border-l-forest bg-cream-warm p-5">
      <div className="flex gap-4">
        <img src="/products/high-protein-cookbook.jpg" alt="30 High-Protein Plant-Based Meals cookbook" loading="lazy" className="h-24 w-20 shrink-0 rounded-lg object-cover" />
        <div>
          <p className="font-display text-lg italic text-forest-deep">Want dinners like this all week?</p>
          <ul className="mt-2 space-y-1 text-sm text-charcoal/75">
            <li>✓ 30 high-protein plant-based recipes</li>
            <li>✓ Calories &amp; macros on every recipe</li>
            <li>✓ Most ready in under 30 minutes</li>
          </ul>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link to="/shop" className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-primary-foreground no-underline">Get the Cookbook — $14.99</Link>
        <Link to="/free-cookbook" className="text-sm text-forest underline underline-offset-4">or grab the free 12-recipe guide</Link>
      </div>
    </aside>
  );
}
