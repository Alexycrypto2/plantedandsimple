import { createFileRoute } from "@tanstack/react-router";
import { BlogList } from "@/routes/_authenticated/admin";
import type { AdminPost } from "@/lib/blog.functions";
import cover from "@/assets/cat-dinners.jpg";

const CATS = ["Dinners", "Meal prep", "Protein", "Budget", "Date night"];
const TITLES = [
  "11 cozy high-protein vegan date night dinner ideas",
  "How to hit 30g protein per plant-based meal",
  "5 pantry staples that make weeknight dinners faster",
  "The 20-minute tofu skillet you can vary forever",
  "Batch-cooking lentils without the mush",
  "What I actually eat in a busy work week",
  "Cheap plant protein that beats the price of meat",
  "A Sunday prep routine for two people",
];

const POSTS: AdminPost[] = Array.from({ length: 60 }, (_, i) => {
  const title = `${i + 1}. ${TITLES[i % TITLES.length]} — variant ${i}`;
  return {
    id: `mock-${i}`,
    slug: `mock-article-${i}`,
    title,
    excerpt: "Short preview line for the mock article.",
    content: `<p>${"word ".repeat(180 + i * 7)}</p>`,
    featured_image_url: i % 4 === 0 ? cover : null,
    category: CATS[i % CATS.length],
    tags: ["high protein", "vegan"],
    seo_title: null,
    seo_description: null,
    published_at: "2026-11-01",
    status: i % 5 === 0 ? "draft" : "published",
    created_at: `2026-1${(i % 9) + 1}-0${(i % 9) + 1}T10:00:00Z`,
  };
});

export const Route = createFileRoute("/zz-blog-preview")({
  component: () => (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <BlogList
        posts={POSTS}
        onEdit={() => {}}
        onDelete={() => {}}
        onReload={async () => {}}
        onError={() => {}}
      />
    </div>
  ),
});
