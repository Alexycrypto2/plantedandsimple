import { pageHead, pageUrl, plainDescription, jsonLd, breadcrumbs, productSchema } from "@/lib/seo";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { fallbackPost } from "@/lib/fallback-content";
import { getPublishedPostBySlug, type PublicPost } from "@/lib/blog.functions";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  loader: async ({ params }): Promise<{ post: PublicPost }> => {
    let post: PublicPost | null = null;
    try { post = await getPublishedPostBySlug({ data: { slug: params.slug } }); } catch { post = null; }
    if (!post) post = fallbackPost(params.slug);
    if (!post) throw notFound();
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
    const image = post.featured_image_url?.startsWith("https://") ? post.featured_image_url : undefined;
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
        <div
          className="article-body mt-10"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        {(post.tags ?? []).length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2">
            {(post.tags ?? []).map((t) => (
              <span key={t} className="rounded-full border border-forest/20 px-3 py-1 text-xs text-charcoal/70">
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-16 rounded-[2rem] bg-cream-warm/60 p-8 text-center">
          <p className="font-display text-xl italic text-forest-deep">Loved this? Our cookbooks go deeper.</p>
          <Link to="/shop" className="mt-4 inline-flex rounded-full bg-forest px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-cream hover:bg-forest-deep">
            Browse Cookbooks
          </Link>
        </div>
      </article>
    </SiteLayout>
  );
}