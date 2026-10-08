import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard, TrendingUp, Package, LibraryBig, ChefHat, BookOpen,
  FileText, Sparkles, Image as ImageIcon, CheckCircle2, Settings2,
  Users, LogOut, ExternalLink, Search, X, Menu, Waves, Zap, Palette, Rocket,
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
  campaigns: { label: "Campaign Center", icon: Rocket, group: "Growth" },
  products: { label: "Products", icon: Package, group: "Growth" },
  "meal-prep": { label: "Meal Prep Members", icon: ChefHat, group: "Growth" },
  "prep-cookbooks": { label: "Prep Cookbooks", icon: BookOpen, group: "Growth" },
  audience: { label: "Audience", icon: Users, group: "Growth" },
  approvals: { label: "Approval Queue", icon: CheckCircle2, group: "Growth" },
  analytics: { label: "Analytics", icon: TrendingUp, group: "Growth" },
  settings: { label: "Settings", icon: Settings2, group: "Configure" },
};

const GROUP_ORDER = ["Overview", "Content", "Growth", "Configure"];

/** Each workspace carries its own accent + ambience so sections feel like different rooms. */
export const WORKSPACE_THEME: Record<string, { accent: string; tint: string; mood: string }> = {
  dashboard: { accent: "#2e5e3b", tint: "#7fa77a", mood: "The whole brand, breathing in real time" },
  library:   { accent: "#3f6f8f", tint: "#8fc0d8", mood: "Everything you've ever made, connected" },
  recipes:   { accent: "#a4592f", tint: "#e0a878", mood: "The kitchen — where the flavour starts" },
  blogs:     { accent: "#5a4a86", tint: "#a99ad6", mood: "Long-form storytelling studio" },
  "ai-studio": { accent: "#7a3f6a", tint: "#d19cc4", mood: "Your quiet collaborator" },
  pinterest: { accent: "#b03b52", tint: "#f0a3b0", mood: "Where the world discovers you" },
  products:  { accent: "#8a6a1f", tint: "#e5c477", mood: "The shelf that pays the bills" },
  audience:  { accent: "#2b6f66", tint: "#8fd3c6", mood: "The people on the other side" },
  approvals: { accent: "#8a5a13", tint: "#efc07a", mood: "Nothing ships without you" },
  analytics: { accent: "#2f5a7a", tint: "#93c2dd", mood: "Proof that it's working" },
  settings:  { accent: "#4a4f49", tint: "#a9b1a6", mood: "The quiet machinery" },
};

function theme(tab: string) {
  return WORKSPACE_THEME[tab] ?? WORKSPACE_THEME["dashboard"]!;
}

/* --------------------------------- themes --------------------------------- */

export type AdminThemeId = "cream" | "ink" | "gold" | "snow";

export const ADMIN_THEMES: Record<
  AdminThemeId,
  { label: string; swatch: string[]; accent?: { accent: string; tint: string } }
> = {
  cream: { label: "Cream editorial", swatch: ["#faf8f3", "#2e5e3b", "#7fa77a"] },
  ink: { label: "Ink black", swatch: ["#080a08", "#86e0a4", "#4e7d5e"], accent: { accent: "#86e0a4", tint: "#3f7a55" } },
  gold: { label: "Gold luxe", swatch: ["#0c0a06", "#e3c273", "#8a6a1f"], accent: { accent: "#e3c273", tint: "#8a6a1f" } },
  snow: { label: "Snow white", swatch: ["#ffffff", "#14181c", "#8c959e"], accent: { accent: "#1f2429", tint: "#8c959e" } },
};

/** Persisted admin skin. Scoped to the admin surface only. */
function useAdminTheme() {
  const [id, setId] = useState<AdminThemeId>("cream");
  useEffect(() => {
    const saved = (typeof window !== "undefined" ? window.localStorage.getItem("pd-admin-theme") : null) as AdminThemeId | null;
    const next = saved && saved in ADMIN_THEMES ? saved : "cream";
    setId(next);
    document.documentElement.dataset["adminTheme"] = next;
    return () => {
      delete document.documentElement.dataset["adminTheme"];
    };
  }, []);
  const set = (next: AdminThemeId) => {
    setId(next);
    document.documentElement.dataset["adminTheme"] = next;
    try { window.localStorage.setItem("pd-admin-theme", next); } catch { /* ignore */ }
  };
  return { id, set };
}

/** Every workspace opens with its own inspiring introduction. */
export const WORKSPACE_INTRO: Record<string, { headline: string; sub: string }> = {
  library:     { headline: "Everything you've created lives here.", sub: "Recipes, stories, pins and products — one connected library." },
  recipes:     { headline: "What are we cooking next?", sub: "Every recipe becomes a blog, a pin, a campaign and a chapter." },
  blogs:       { headline: "Tell a story worth reading.", sub: "Research, draft, illustrate and optimise — with AI beside you." },
  "ai-studio": { headline: "What would you like to create today?", sub: "Trends, drafts, images and experiments, all in one room." },
  pinterest:   { headline: "Design Pinterest content that gets saved.", sub: "Branded pins, best posting windows, real discovery." },
  products:    { headline: "The shelf that pays the bills.", sub: "Cookbooks, bundles and offers your readers actually buy." },
  audience:    { headline: "The people on the other side.", sub: "Subscribers, buyers and the humans behind every download." },
  approvals:   { headline: "Nothing ships without you.", sub: "Preview, understand and approve everything the AI prepared." },
  analytics:   { headline: "Proof that it's working.", sub: "Traffic, pins, downloads and revenue — connected end to end." },
  settings:    { headline: "The quiet machinery.", sub: "Keys, integrations and the rules your AI works within." },
};

/** Rotating "the AI is working" messages — pure presentation. */
const AI_THOUGHTS = [
  "Analysing Pinterest saves…",
  "Checking Google Trends…",
  "Learning from yesterday's campaign…",
  "Generating tomorrow's recommendations…",
  "Updating seasonal opportunities…",
  "Scanning recipes with strong potential…",
  "Re-ranking topics by brand fit…",
];

function AiThought() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % AI_THOUGHTS.length), 5200);
    return () => clearInterval(id);
  }, []);
  return (
    <span key={i} className="animate-ticker-in inline-flex items-center gap-1.5 truncate">
      <Sparkles className="size-3 shrink-0" />
      {AI_THOUGHTS[i]}
    </span>
  );
}

/** Global, persisted reduced-motion switch. */
function useMotionToggle() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("pd-motion") : null;
    const enabled = saved !== "off";
    setOn(enabled);
    document.documentElement.dataset["motion"] = enabled ? "on" : "off";
  }, []);
  const toggle = () => {
    setOn((prev) => {
      const next = !prev;
      document.documentElement.dataset["motion"] = next ? "on" : "off";
      try { window.localStorage.setItem("pd-motion", next ? "on" : "off"); } catch { /* ignore */ }
      return next;
    });
  };
  return { on, toggle };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Living backdrop: slow drifting aurora fields tinted by the active workspace. */
function Ambience() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="animate-aurora absolute -left-[18%] -top-[22%] size-[62vw] rounded-full blur-[110px] transition-colors duration-1000"
        style={{ background: "color-mix(in oklab, var(--ws-accent) 26%, transparent)" }}
      />
      <div
        className="animate-aurora absolute -right-[14%] top-[12%] size-[48vw] rounded-full blur-[120px] transition-colors duration-1000"
        style={{ background: "color-mix(in oklab, var(--ws-tint) 30%, transparent)", animationDelay: "-9s" }}
      />
      <div
        className="animate-aurora absolute bottom-[-20%] left-[22%] size-[52vw] rounded-full blur-[130px] transition-colors duration-1000"
        style={{ background: "color-mix(in oklab, var(--ws-accent) 16%, transparent)", animationDelay: "-17s" }}
      />
    </div>
  );
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
  const motion = useMotionToggle();
  const skin = useAdminTheme();

  useEffect(() => { setOpen(false); }, [activeTab]);

  const visible = tabs.filter((t) =>
    !q.trim() || (NAV_META[t]?.label ?? t).toLowerCase().includes(q.trim().toLowerCase()),
  );
  const groups = GROUP_ORDER.map((g) => ({
    name: g,
    items: visible.filter((t) => (NAV_META[t]?.group ?? "Command") === g),
  })).filter((g) => g.items.length > 0);

  const active = NAV_META[activeTab];
  const base = theme(activeTab);
  const lock = ADMIN_THEMES[skin.id]?.accent;
  const ws = lock ? { ...base, accent: lock.accent, tint: lock.tint } : base;
  const intro = WORKSPACE_INTRO[activeTab];

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div
          className="animate-float grid size-11 shrink-0 place-items-center rounded-2xl text-cream shadow-lg transition-colors duration-700"
          style={{
            background: "linear-gradient(140deg, var(--ws-accent), var(--ws-tint))",
            boxShadow: "0 12px 30px -12px color-mix(in oklab, var(--ws-accent) 70%, transparent)",
          }}
        >
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-xl italic leading-tight text-forest-deep">PrimeDownloads</p>
          <p className="truncate font-mono text-[9px] uppercase tracking-[0.28em] text-charcoal/40">Operating System</p>
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
        <div className="flex items-center gap-2 rounded-2xl border border-forest/10 bg-white/60 px-3 py-2.5 shadow-inner backdrop-blur transition focus-within:border-[var(--ws-accent)]/40 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--ws-accent)_10%,transparent)]">
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
              {g.items.map((t, i) => {
                const meta = NAV_META[t] ?? { label: t, icon: LayoutDashboard, group: "Command" };
                const Icon = meta.icon;
                const isActive = activeTab === t;
                const tt = theme(t);
                return (
                  <button
                    key={t}
                    onClick={() => onSelect(t)}
                    style={{
                      animationDelay: `${i * 45}ms`,
                      ...(isActive
                        ? {
                            background: `linear-gradient(120deg, ${tt.accent}, color-mix(in oklab, ${tt.tint} 85%, white))`,
                            boxShadow: `0 14px 28px -16px ${tt.accent}`,
                          }
                        : {}),
                    }}
                    className={`group animate-blur-in relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-left text-[13px] font-semibold transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isActive
                        ? "scale-[1.015] text-cream"
                        : "text-charcoal/70 hover:translate-x-1 hover:bg-white/70 hover:text-forest-deep"
                    }`}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-xl transition-all duration-500 ${
                        isActive ? "bg-white/20" : "bg-forest/[0.05] group-hover:scale-110"
                      }`}
                      style={isActive ? {} : { color: tt.accent }}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="truncate">{meta.label}</span>
                    {isActive && <span className="ml-auto size-1.5 rounded-full bg-cream/90 animate-live" />}
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

      <div className="m-3 rounded-2xl border border-forest/10 bg-white/60 p-3 backdrop-blur">
        <div className="mb-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 px-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-charcoal/40">
            <Palette className="size-3" /> Panel theme
          </p>
          <div className="flex gap-1.5 px-1">
            {(Object.keys(ADMIN_THEMES) as AdminThemeId[]).map((id) => {
              const t = ADMIN_THEMES[id]!;
              const on = skin.id === id;
              return (
                <button
                  key={id}
                  onClick={() => skin.set(id)}
                  title={t.label}
                  aria-label={t.label}
                  aria-pressed={on}
                  className={`group relative h-8 flex-1 overflow-hidden rounded-xl border transition-all duration-500 hover:-translate-y-0.5 ${
                    on ? "border-[var(--ws-accent)] shadow-md" : "border-charcoal/10"
                  }`}
                  style={{ background: `linear-gradient(120deg, ${t.swatch[0]} 0%, ${t.swatch[0]} 45%, ${t.swatch[1]} 46%, ${t.swatch[2]} 100%)` }}
                >
                  {on && <span className="absolute inset-0 animate-live rounded-xl ring-2 ring-inset ring-[var(--ws-accent)]" />}
                </button>
              );
            })}
          </div>
        </div>
        <button
          onClick={motion.toggle}
          className="mb-2.5 flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[11px] font-semibold text-charcoal/60 transition hover:bg-forest/5 hover:text-forest-deep"
          aria-pressed={!motion.on}
        >
          {motion.on ? <Waves className="size-3.5" /> : <Zap className="size-3.5" />}
          <span className="truncate">{motion.on ? "Motion on" : "Reduced motion"}</span>
          <span
            className={`ml-auto flex h-4 w-8 shrink-0 items-center rounded-full p-0.5 transition-colors ${motion.on ? "bg-[var(--ws-accent)]" : "bg-charcoal/20"}`}
          >
            <span className={`size-3 rounded-full bg-white transition-transform duration-300 ${motion.on ? "translate-x-4" : ""}`} />
          </span>
        </button>
        <div className="flex items-center gap-2.5">
          <div
            className="grid size-9 shrink-0 place-items-center rounded-full font-display text-sm italic text-cream"
            style={{ background: "linear-gradient(140deg, var(--ws-accent), var(--ws-tint))" }}
          >
            {(email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-charcoal/80">{email}</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-charcoal/40">{isBoss ? "boss" : "admin"}</p>
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
    <div
      className="relative min-h-screen bg-cream font-sans text-charcoal"
      style={{ ["--ws-accent" as any]: ws.accent, ["--ws-tint" as any]: ws.tint }}
    >
      <Ambience />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/50 bg-white/55 backdrop-blur-2xl lg:flex lg:flex-col">
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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/50 bg-cream/95 shadow-2xl backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>

      <div className="relative z-10 lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/50 bg-cream/60 backdrop-blur-2xl">
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px transition-colors duration-700"
            style={{ background: "linear-gradient(90deg, transparent, var(--ws-accent), transparent)", opacity: 0.4 }}
          />
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 sm:px-6">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid size-9 place-items-center rounded-2xl border border-white/60 bg-white/70 text-forest backdrop-blur transition active:scale-95 lg:hidden"
            >
              <Menu className="size-4" />
            </button>
            <div key={activeTab} className="min-w-0 animate-blur-in">
              <p
                className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.24em] transition-colors duration-700"
                style={{ color: "var(--ws-accent)" }}
              >
                <span className="size-1.5 rounded-full bg-[var(--ws-accent)] animate-live" />
                {active?.group ?? "Admin"} · {active?.label ?? activeTab}
              </p>
              <h1 className="truncate font-display text-xl italic text-forest-deep sm:text-2xl">
                {activeTab === "dashboard" ? `${greeting()} ✨` : (active?.label ?? activeTab)}
              </h1>
              <p className="hidden truncate text-[11px] text-charcoal/50 sm:block">
                <AiThought />
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 justify-self-end">
              <a
                href="/prep-app"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-forest/25 bg-white/70 px-3 py-2 text-[11px] font-semibold text-forest-deep transition hover:-translate-y-0.5 hover:bg-white sm:px-4 sm:text-xs"
              >
                Launch Prep App <ExternalLink className="size-3.5" />
              </a>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                style={{ background: "linear-gradient(120deg, var(--ws-accent), var(--ws-tint))" }}
                className="sheen-on-hover relative inline-flex w-fit items-center gap-1.5 overflow-hidden rounded-full px-3 py-2 text-[11px] font-semibold text-cream shadow-lg transition-all duration-500 hover:-translate-y-0.5 sm:px-4 sm:text-xs"
              >
                View site <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </header>

        <main key={activeTab} className="animate-blur-in mx-auto max-w-7xl px-4 pb-24 pt-7 sm:px-6">
          {intro && (
            <section className="relative mb-7 overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/45 px-5 py-6 backdrop-blur-xl sm:px-8 sm:py-8">
              <div
                aria-hidden
                className="animate-float pointer-events-none absolute -right-12 -top-14 size-52 rounded-full blur-3xl"
                style={{ background: "color-mix(in oklab, var(--ws-accent) 20%, transparent)" }}
              />
              <p className="relative font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-[var(--ws-accent)]">
                {ws.mood}
              </p>
              <h2 className="relative mt-2 max-w-2xl font-display text-2xl italic leading-[1.15] text-forest-deep sm:text-4xl">
                ✨ {intro.headline}
              </h2>
              <p className="relative mt-2 max-w-xl text-[13px] leading-relaxed text-charcoal/55">{intro.sub}</p>
            </section>
          )}
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
    <div className="-mx-1 mb-7 flex gap-1.5 overflow-x-auto rounded-full border border-white/60 bg-white/55 p-1.5 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.5)] backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t) => {
        const Icon = t.icon;
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={
              on
                ? {
                    background: "linear-gradient(120deg, var(--ws-accent), var(--ws-tint))",
                    boxShadow: "0 14px 26px -18px var(--ws-accent)",
                  }
                : {}
            }
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              on
                ? "scale-[1.03] text-cream"
                : "text-charcoal/60 hover:-translate-y-0.5 hover:bg-white/80 hover:text-forest-deep"
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
  return <div className={`shimmer-surface rounded-2xl ${className}`} />;
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  title, hint, action, steps,
}: { title: string; hint?: string; action?: ReactNode; steps?: string[] }) {
  return (
    <div className="relative grid place-items-center overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/45 px-6 py-16 text-center backdrop-blur-xl">
      <div
        aria-hidden
        className="animate-float pointer-events-none absolute -top-10 size-40 rounded-full blur-3xl"
        style={{ background: "color-mix(in oklab, var(--ws-accent) 18%, transparent)" }}
      />
      <div
        className="relative grid size-12 place-items-center rounded-2xl text-cream shadow-lg"
        style={{ background: "linear-gradient(140deg, var(--ws-accent), var(--ws-tint))" }}
      >
        <Sparkles className="size-5" />
      </div>
      <p className="relative mt-4 font-display text-xl italic text-forest-deep">{title}</p>
      {hint && <p className="relative mt-1.5 max-w-sm text-xs leading-relaxed text-charcoal/55">{hint}</p>}
      {steps && steps.length > 0 && (
        <ul className="relative mt-4 grid gap-1.5 text-left">
          {steps.map((s, i) => (
            <li
              key={s}
              style={{ animationDelay: `${i * 70}ms` }}
              className="animate-blur-in flex items-center gap-2 text-[11px] text-charcoal/60"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-[var(--ws-accent)]" />
              {s}
            </li>
          ))}
        </ul>
      )}
      {action && <div className="relative mt-5">{action}</div>}
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

/** Counts a numeric value up on mount — purely presentational. */
function useCountUp(raw: string | number) {
  const text = String(raw);
  const match = text.match(/-?[\d.]+/);
  const target = match ? Number(match[0]) : null;
  const [n, setN] = useState(target === null ? 0 : 0);
  const done = useRef(false);

  useEffect(() => {
    if (target === null || done.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(target); return; }
    done.current = true;
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  if (target === null || !match) return text;
  const decimals = (match[0].split(".")[1] ?? "").length;
  return text.replace(match[0], n.toFixed(decimals));
}

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
  const shown = useCountUp(value);
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="sheen-on-hover animate-blur-in group relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/60 p-4 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:bg-white/80 hover:shadow-[0_30px_60px_-30px_color-mix(in_oklab,var(--ws-accent)_45%,transparent)] sm:p-5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
        style={{ background: "color-mix(in oklab, var(--ws-accent) 30%, transparent)" }}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-charcoal/45">
          {label}
        </p>
        {Icon && (
          <span className={`grid size-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br shadow-md transition-all duration-500 group-hover:-rotate-6 group-hover:scale-110 ${TONES[tone] ?? TONES["forest"]}`}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2.5 font-display text-[1.75rem] italic leading-none text-forest-deep tabular-nums sm:text-4xl">{shown}</p>
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
    <section className={`animate-blur-in group relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/60 p-5 shadow-[0_18px_44px_-34px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-[0_28px_60px_-34px_color-mix(in_oklab,var(--ws-accent)_45%,transparent)] sm:p-6 ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{ background: "linear-gradient(90deg, transparent, var(--ws-accent), transparent)" }}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span
              className="grid size-9 shrink-0 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-110"
              style={{ background: "color-mix(in oklab, var(--ws-accent) 12%, transparent)", color: "var(--ws-accent)" }}
            >
              <Icon className="size-4" />
            </span>
          )}
          <h3 className="truncate font-display text-xl italic text-forest-deep">{title}</h3>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* --------------------------- content relationships -------------------------- */

/** Visual map of how one piece of content flows through the brand. Presentational only. */
export function FlowRibbon({
  steps,
}: {
  steps: { label: string; icon: LucideIcon; hint?: string }[];
}) {
  return (
    <div className="relative overflow-x-auto rounded-[1.75rem] border border-white/60 bg-white/45 px-5 py-6 backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className="animate-blur-in group flex w-32 flex-col items-center gap-2 rounded-2xl px-3 py-3 text-center transition-all duration-500 hover:-translate-y-1"
              style={{ animationDelay: `${i * 110}ms` }}
            >
              <span className="relative grid size-10 place-items-center">
                <span
                  aria-hidden
                  className="animate-node-pulse absolute inset-0 rounded-2xl"
                  style={{
                    background: "color-mix(in oklab, var(--ws-accent) 40%, transparent)",
                    animationDelay: `${i * 380}ms`,
                  }}
                />
                <span
                  className="relative grid size-10 place-items-center rounded-2xl text-cream shadow-lg transition-transform duration-500 group-hover:scale-110"
                  style={{
                    background: "linear-gradient(140deg, var(--ws-accent), var(--ws-tint))",
                    boxShadow: "0 16px 30px -18px var(--ws-accent)",
                  }}
                >
                  <s.icon className="size-4" />
                </span>
              </span>
              <span className="text-[11px] font-bold text-forest-deep">{s.label}</span>
              {s.hint && <span className="text-[10px] leading-tight text-charcoal/50">{s.hint}</span>}
            </div>
            {i < steps.length - 1 && (
              <svg width="34" height="8" viewBox="0 0 34 8" className="shrink-0 opacity-70">
                <line
                  x1="0" y1="4" x2="34" y2="4"
                  stroke="var(--ws-accent)" strokeWidth="1.5" strokeLinecap="round"
                  strokeDasharray="4 8" className="animate-dash-flow"
                />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}