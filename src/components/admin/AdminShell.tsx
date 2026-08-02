import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, TrendingUp, Package, LibraryBig, ChefHat,
  FileText, Sparkles, Image as ImageIcon, CheckCircle2, Settings2,
  Users, LogOut, ExternalLink, Search, X, Menu,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { id: string; label: string; icon: LucideIcon; group: string };

export const NAV_META: Record<string, { label: string; icon: LucideIcon; group: string }> = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  library: { label: "Content Library", icon: LibraryBig, group: "Content" },
  recipes: { label: "Recipes", icon: ChefHat, group: "Content" },
  blogs: { label: "Blogs", icon: FileText, group: "Content" },
  "ai-studio": { label: "AI Studio", icon: Sparkles, group: "Content" },
  pinterest: { label: "Pinterest Studio", icon: ImageIcon, group: "Content" },
  products: { label: "Products", icon: Package, group: "Growth" },
  audience: { label: "Audience", icon: Users, group: "Growth" },
  approvals: { label: "Approval Queue", icon: CheckCircle2, group: "Growth" },
  analytics: { label: "Analytics", icon: TrendingUp, group: "Growth" },
  settings: { label: "Settings", icon: Settings2, group: "Configure" },
};

const GROUP_ORDER = ["Overview", "Content", "Growth", "Configure"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function AdminShell({
  tabs, activeTab, onSelect, email, isBoss, onLogout, children,
}: {
  tabs: string[];
  activeTab: string;
  onSelect: (t: string) => void;
  email: string | null;
  isBoss: boolean;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => { setOpen(false); }, [activeTab]);

  const visible = tabs.filter((t) =>
    !q.trim() || (NAV_META[t]?.label ?? t).toLowerCase().includes(q.trim().toLowerCase()),
  );
  const groups = GROUP_ORDER.map((g) => ({
    name: g,
    items: visible.filter((t) => (NAV_META[t]?.group ?? "Command") === g),
  })).filter((g) => g.items.length > 0);

  const active = NAV_META[activeTab];

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-forest to-sage text-cream shadow-lg shadow-forest/25">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg italic leading-tight text-forest-deep">Admin</p>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-sage">Command Center</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="ml-auto grid size-8 place-items-center rounded-full text-charcoal/50 hover:bg-forest/5 lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-xl border border-forest/10 bg-cream-warm/60 px-3 py-2">
          <Search className="size-3.5 shrink-0 text-charcoal/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to…"
            className="w-full min-w-0 bg-transparent text-xs text-charcoal outline-none placeholder:text-charcoal/40"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g.name}>
            <p className="px-3 pb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-charcoal/35">
              {g.name}
            </p>
            <div className="space-y-0.5">
              {g.items.map((t) => {
                const meta = NAV_META[t] ?? { label: t, icon: LayoutDashboard, group: "Command" };
                const Icon = meta.icon;
                const isActive = activeTab === t;
                return (
                  <button
                    key={t}
                    onClick={() => onSelect(t)}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-forest text-cream shadow-md shadow-forest/20"
                        : "text-charcoal/70 hover:translate-x-0.5 hover:bg-forest/[0.06] hover:text-forest-deep"
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`} />
                    <span className="truncate">{meta.label}</span>
                    {isActive && <span className="ml-auto size-1.5 rounded-full bg-cream/80" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="px-3 text-xs text-charcoal/50">No matches.</p>
        )}
      </nav>

      <div className="border-t border-forest/10 p-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-sage/25 font-display text-sm italic text-forest-deep">
            {(email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-charcoal/80">{email}</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-sage">{isBoss ? "boss" : "admin"}</p>
          </div>
          <button
            onClick={onLogout}
            aria-label="Sign out"
            className="grid size-8 shrink-0 place-items-center rounded-full text-charcoal/50 transition hover:bg-forest/5 hover:text-forest-deep"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_80%_at_0%_0%,color-mix(in_oklab,var(--sage)_16%,transparent),transparent_60%)] bg-cream font-sans text-charcoal">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-forest/10 bg-white/85 backdrop-blur-xl lg:flex lg:flex-col">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-charcoal/40 backdrop-blur-sm animate-in fade-in duration-200 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-forest/10 bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-forest/10 bg-cream/80 backdrop-blur-xl">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid size-9 place-items-center rounded-xl border border-forest/15 bg-white text-forest lg:hidden"
            >
              <Menu className="size-4" />
            </button>
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-sage">
                {active?.group ?? "Admin"}
              </p>
              <h1 className="truncate font-display text-xl italic text-forest-deep sm:text-2xl">
                {activeTab === "overview" ? `${greeting()} ✨` : (active?.label ?? activeTab)}
              </h1>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit shrink-0 items-center gap-1.5 justify-self-end rounded-full bg-forest px-3 py-2 text-[11px] font-semibold text-cream shadow-md shadow-forest/20 transition hover:bg-forest-deep sm:px-4 sm:text-xs"
            >
              View site <ExternalLink className="size-3.5" />
            </a>
          </div>
        </header>

        <main key={activeTab} className="mx-auto max-w-7xl px-4 pb-16 pt-6 duration-500 animate-in fade-in slide-in-from-bottom-2 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------ sub navigation ----------------------------- */

export function SectionTabs({
  tabs, active, onSelect,
}: {
  tabs: { id: string; label: string; icon?: LucideIcon }[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="-mx-1 mb-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-forest/10 bg-white/70 p-1.5 backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t) => {
        const Icon = t.icon;
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-all duration-200 ${
              on
                ? "bg-forest text-cream shadow-md shadow-forest/20"
                : "text-charcoal/60 hover:bg-forest/[0.06] hover:text-forest-deep"
            }`}
          >
            {Icon && <Icon className="size-3.5" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-forest/[0.07] ${className}`} />;
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-forest/15 bg-cream-warm/40 px-6 py-12 text-center">
      <p className="font-display text-lg italic text-forest-deep">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-charcoal/55">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------- primitives ------------------------------- */

const TONES: Record<string, string> = {
  forest: "from-forest to-forest-deep text-cream shadow-forest/25",
  sage: "from-sage to-forest text-cream shadow-sage/30",
  amber: "from-amber-400 to-orange-500 text-white shadow-orange-300/40",
  violet: "from-violet-400 to-indigo-500 text-white shadow-indigo-300/40",
  rose: "from-rose-400 to-pink-500 text-white shadow-rose-300/40",
  sky: "from-sky-400 to-cyan-500 text-white shadow-sky-300/40",
};

export function MetricCard({
  label, value, hint, icon: Icon, tone = "forest", delay = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: keyof typeof TONES | string;
  delay?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="group relative overflow-hidden rounded-2xl border border-forest/10 bg-white/90 p-4 shadow-sm backdrop-blur transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/10 sm:p-5"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-sage/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-charcoal/45">
          {label}
        </p>
        {Icon && (
          <span className={`grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br shadow-md transition-transform duration-300 group-hover:scale-110 ${TONES[tone] ?? TONES["forest"]}`}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl italic text-forest-deep sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-snug text-charcoal/55">{hint}</p>}
    </div>
  );
}

export function PanelCard({
  title, icon: Icon, action, children, className = "",
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-forest/10 bg-white/90 p-5 shadow-sm backdrop-blur transition-shadow hover:shadow-lg hover:shadow-forest/5 sm:p-6 ${className}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-forest/8 text-forest">
              <Icon className="size-4" />
            </span>
          )}
          <h3 className="truncate font-display text-lg italic text-forest-deep">{title}</h3>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}