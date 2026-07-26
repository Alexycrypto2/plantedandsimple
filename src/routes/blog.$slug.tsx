import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { getPublishedPostBySlug, type PublicPost } from "@/lib/blog.functions";

export const Route = createFileRoute("/blog/$slug")({
  component: PostPage,
  loader: async ({ params }): Promise<{ post: PublicPost }> => {
    const post = await getPublishedPostBySlug({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return { post };
  },
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-red-600">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-4xl italic text-forest-deep">Article not found</h1>
        <Link to="/blog" className="mt-6 inline-block text-forest underline">
          Back to The Journal
        </Link>
      </div>
    </SiteLayout>
  ),
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    const title = post ? `${post.seo_title ?? post.title} — PlantedAndSimple` : "Article — PlantedAndSimple";
    const desc = post?.seo_description ?? post?.excerpt ?? "A plant-based journal article.";
    const img = post?.featured_image_url;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        ...(img
          ? [
              { property: "og:image", content: img },
              { name: "twitter:image", content: img },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
});

function PostPage() {
  const { post } = Route.useLoaderData() as { post: PublicPost };
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/blog" className="text-xs font-bold uppercase tracking-[0.25em] text-forest/70 hover:text-forest">
          ← The Journal
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
          className="prose prose-lg mt-8 max-w-none text-charcoal/85"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        {post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2">
            {post.tags.map((t) => (
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