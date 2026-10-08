import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Home, BookOpen, CalendarDays, ShoppingBasket, ChefHat, Archive, Lightbulb, User, LogOut, Heart } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/prep-app", label: "Home", icon: Home, mobile: true },
  { to: "/prep-app/recipes", label: "Recipes", icon: BookOpen, mobile: true },
  { to: "/prep-app/planner", label: "Planner", icon: CalendarDays, mobile: true },
  { to: "/prep-app/grocery", label: "Grocery", icon: ShoppingBasket, mobile: true },
  { to: "/prep-app/kitchen", label: "Prep", icon: ChefHat, mobile: true },
  { to: "/prep-app/pantry", label: "Pantry", icon: Archive, mobile: false },
  { to: "/prep-app/plans", label: "Saved weeks", icon: CalendarDays, mobile: false },
  { to: "/prep-app/guides", label: "Guides & smoothies", icon: Lightbulb, mobile: false },
  { to: "/prep-app/profile", label: "Profile", icon: User, mobile: false },
] as const;

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`font-display text-lg font-extrabold tracking-tight ${light ? "text-sidebar-foreground" : "text-primary"}`}>
      Planted<span className="text-gold">&</span>Simple
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="min-h-screen md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar p-5 text-sidebar-foreground md:flex">
        <Link to="/prep-app" className="mb-1"><Logo light /></Link>
        <p className="mb-8 text-xs text-sidebar-foreground/70">Meal Prep Assistant</p>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={signOut} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/prep-app"><Logo /></Link>
        <div className="flex gap-1">
          <Link to="/prep-app/pantry" className="rounded-full p-2 text-primary" aria-label="Pantry"><Archive className="h-5 w-5" /></Link>
          <Link to="/prep-app/guides" className="rounded-full p-2 text-primary" aria-label="Guides"><Lightbulb className="h-5 w-5" /></Link>
          <Link to="/prep-app/recipes" search={{ fav: true }} className="rounded-full p-2 text-primary" aria-label="Favourites"><Heart className="h-5 w-5" /></Link>
          <Link to="/prep-app/profile" className="rounded-full p-2 text-primary" aria-label="Profile"><User className="h-5 w-5" /></Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.filter((n) => n.mobile).map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <n.icon className="h-5 w-5" /> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-extrabold text-primary md:text-3xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
      <p className="font-display text-lg font-bold text-primary">{title}</p>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
