export function MacroRing({ value, target, label, sub }: { value: number; target: number; label: string; sub?: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 shrink-0" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div><p className="font-display text-2xl font-extrabold leading-none text-primary">{pct}%</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">protein</p></div>
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-display text-xl font-bold text-primary">{value}g <span className="text-sm font-medium text-muted-foreground">/ {target}g</span></p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub ? <p className="mt-1 text-xs font-semibold text-gold">{sub}</p> : null}
        {pct >= 100 ? <p className="mt-1 text-sm font-semibold text-primary">Goal reached 🎉</p> : null}
      </div>
    </div>
  );
}
