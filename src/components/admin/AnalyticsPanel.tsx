import { useEffect, useState } from "react";
import {
  Eye, MousePointerClick, TrendingUp, DollarSign, Download, Users, Sparkles, RefreshCw, Search,
} from "lucide-react";
import { adminAnalyticsOverview, type AnalyticsOverview } from "@/lib/analytics.functions";
import { MetricCard, PanelCard, SkeletonList, EmptyState } from "./AdminShell";

const WINDOWS = [7, 30, 90];

function Sparkline({ points }: { points: { date: string; views: number; clicks: number; sales: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.views));
  return (
    <div className="flex h-24 items-end gap-[3px]">
      {points.map((p) => (
        <div key={p.date} className="group relative flex-1" title={`${p.date} · ${p.views} views · ${p.clicks} clicks`}>
          <div
            className="w-full rounded-t bg-gradient-to-t from-sage/50 to-forest transition-all duration-300 group-hover:from-forest group-hover:to-forest-deep"
            style={{ height: `${Math.max(3, (p.views / max) * 96)}px` }}
          />
        </div>
      ))}
    </div>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-forest/8">
      <div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

export function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [busy, setBusy] = useState(false);

  const load = (d = days) => {
    setBusy(true);
    return adminAnalyticsOverview({ data: { windowDays: d } })
      .then((r) => setData(r as AnalyticsOverview))
      .finally(() => setBusy(false));
  };

  useEffect(() => { void load(days); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [days]);
  useEffect(() => {
    const t = setInterval(() => { void load(); }, 60_000);
    return () => clearInterval(t);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [days]);

  if (!data) return <SkeletonList rows={6} />;
  const t = data.totals;
  const maxChannel = Math.max(1, ...data.channels.map((c) => c.views));

  return (
    <div className="space-y-5 duration-300 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {WINDOWS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${
                d === days ? "border-forest bg-forest text-cream" : "border-forest/15 text-charcoal/60 hover:bg-forest/5"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <button
          onClick={() => load()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-forest/15 px-3.5 py-2 text-xs font-semibold text-forest hover:bg-forest/5"
        >
          <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} /> Live refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Page views" value={t.page_views} hint={`${t.sessions} sessions`} icon={Eye} delay={0} />
        <MetricCard label="Pinterest clicks" value={t.pinterest_clicks} hint={`CTR ${t.pinterest_ctr}%`} icon={MousePointerClick} tone="rose" delay={60} />
        <MetricCard label="Revenue" value={`$${t.revenue.toFixed(2)}`} hint={`${t.purchases} orders`} icon={DollarSign} tone="amber" delay={120} />
        <MetricCard label="Downloads" value={t.downloads} hint={`${t.download_rate_pct}% of buyers`} icon={Download} tone="sage" delay={180} />
        <MetricCard label="Conversion" value={`${t.conversion_pct}%`} hint={`${t.checkout_starts} checkouts started`} icon={TrendingUp} delay={240} />
        <MetricCard label="CTA clicks" value={t.cta_clicks} hint="Buttons & internal links" icon={MousePointerClick} tone="sage" delay={300} />
        <MetricCard label="Affiliate clicks" value={t.affiliate_clicks} hint="Referral traffic" icon={Users} tone="amber" delay={360} />
        <MetricCard label="New subscribers" value={t.subscribers} hint={`Last ${data.window_days} days`} icon={Users} delay={420} />
      </div>

      <PanelCard title={`Traffic — last ${data.window_days} days`} icon={TrendingUp}>
        <Sparkline points={data.series} />
        <p className="mt-2 text-[11px] text-charcoal/50">
          Updated {new Date(data.generated_at).toLocaleTimeString()} · refreshes every minute
        </p>
      </PanelCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <PanelCard title="Channels" icon={MousePointerClick}>
          {data.channels.length === 0 ? (
            <EmptyState title="No traffic yet" hint="Visits are tracked automatically as soon as people land on the site." />
          ) : (
            <ul className="space-y-3">
              {data.channels.map((c) => (
                <li key={c.channel}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold capitalize text-charcoal">{c.channel}</span>
                    <span className="text-charcoal/50">{c.views} views · {c.ctr}% conv</span>
                  </div>
                  <div className="mt-1.5"><Bar value={c.views} max={maxChannel} /></div>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>

        <PanelCard title="Top pages" icon={Eye}>
          {data.top_pages.length === 0 ? <EmptyState title="Nothing tracked yet" /> : (
            <ul className="space-y-2">
              {data.top_pages.map((p) => (
                <li key={p.slug} className="flex items-center justify-between rounded-xl border border-forest/8 bg-white px-3 py-2.5 text-xs">
                  <span className="truncate font-semibold text-charcoal">/{p.slug}</span>
                  <span className="shrink-0 text-charcoal/50">{p.views} views · {p.clicks} clicks</span>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>

        <PanelCard title="Pinterest performance" icon={MousePointerClick}>
          {data.pins.length === 0 ? <EmptyState title="No pins yet" hint="Create pins in Pinterest Studio to see click data here." /> : (
            <ul className="space-y-2">
              {data.pins.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-forest/8 bg-white px-3 py-2.5 text-xs">
                  <span className="truncate font-semibold text-charcoal">{p.title}</span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-charcoal/45">{p.status} · {p.clicks} clicks</span>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>

        <PanelCard title="SEO health" icon={Search}>
          {data.seo.length === 0 ? <EmptyState title="No published posts yet" /> : (
            <ul className="space-y-2">
              {data.seo.map((s) => (
                <li key={s.slug} className="flex items-center justify-between gap-3 rounded-xl border border-forest/8 bg-white px-3 py-2.5 text-xs">
                  <span className="truncate font-semibold text-charcoal">{s.title}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.has_meta ? "bg-forest/10 text-forest" : "bg-amber-100 text-amber-700"}`}>
                    {s.has_meta ? `${s.views} views` : "Missing meta"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
      </div>

      <PanelCard title="AI recommendations" icon={Sparkles}>
        {data.recommendations.length === 0 ? (
          <EmptyState title="No new recommendations" hint="The learning engine writes suggestions here as data comes in." />
        ) : (
          <ul className="space-y-2">
            {data.recommendations.map((r) => (
              <li key={r.id} className="rounded-xl border border-forest/8 bg-white px-3 py-3">
                <p className="text-sm font-semibold text-charcoal">{r.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-charcoal/60">{r.reasoning}</p>
                <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-charcoal/40">{r.kind} · priority {r.priority}</p>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}
