import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Loader2 } from "lucide-react";
import { getPrepAccess } from "@/lib/prep-access.functions";
import { getPrepLibrary } from "@/lib/prep-library.functions";
import { applyLibrary } from "@/prep-kit/data/library";
import { AppShell } from "@/prep-kit/components/AppShell";

export const Route = createFileRoute("/_authenticated/prep-app")({
  head: () => ({
    meta: [
      { title: "Meal Prep System — Members | Planted & Simple" },
      { name: "description", content: "Your Planted & Simple meal planner, grocery list and kitchen prep mode." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrepGate,
});

function PrepGate() {
  const check = useServerFn(getPrepAccess);
  const loadLib = useServerFn(getPrepLibrary);
  const q = useQuery({ queryKey: ["prep-access"], queryFn: () => check(), staleTime: 5 * 60_000 });
  const lib = useQuery({
    queryKey: ["prep-library"],
    enabled: !!q.data?.allowed,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      try { const l = await loadLib(); applyLibrary(l); return l; } catch { return null; }
    },
  });

  if (q.isLoading || (q.data?.allowed && lib.isLoading)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (q.data?.allowed) return <AppShell><Outlet key={lib.dataUpdatedAt} /></AppShell>;

  return (
    <div className="grid min-h-screen place-items-center bg-background px-5">
      <div className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="mt-4 font-display text-3xl text-primary">Members only</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The Meal Prep System opens for customers who bought it.
          {q.data?.email ? <> We couldn't find a purchase for <b>{q.data.email}</b>.</> : null} If you
          already paid, sign in with the same email you used at checkout.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/prep" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Get the Meal Prep System
          </Link>
          <Link to="/contact" className="text-sm text-muted-foreground underline">Paid but no access? Contact us</Link>
        </div>
      </div>
    </div>
  );
}
