import { createFileRoute, redirect } from "@tanstack/react-router";

const MAP: Record<string, string> = { cookbook: "high-protein-cookbook", prep: "meal-prep-system", "planning-kit": "planning-kit" };

export const Route = createFileRoute("/products/$")({
  beforeLoad: ({ params }) => {
    const key = (params._splat ?? "").split("/")[0];
    if (!key) throw redirect({ to: "/shop", statusCode: 301 });
    throw redirect({ to: "/shop/$slug", params: { slug: MAP[key] ?? key }, statusCode: 301 });
  },
});
