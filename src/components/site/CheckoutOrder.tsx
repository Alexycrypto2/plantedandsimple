import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PACKAGES, packageTotal, type PackageId } from '@/lib/bundle-offers';
import cookbook from '@/assets/cookbook-mockup.jpg';
import prep from '@/assets/prep-system-cover.jpg';
import kit from '@/assets/kit-page-1.jpg';

const covers = { cookbook, prep, kit };
export function CheckoutOrder({ selected, prices, onChange, recovery = false }: {
  selected: PackageId[]; prices: Partial<Record<PackageId, number>>;
  onChange: (products: PackageId[]) => void; recovery?: boolean;
}) {
  const quote = packageTotal(selected, prices, recovery);
  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  return <section className="mt-8 border-y border-border py-6" aria-label="Customize your order">
    <h2 className="font-display text-2xl text-foreground">Your kitchen, your package</h2>
    <div className="mt-5 divide-y divide-border">
      {PACKAGES.filter(p => prices[p.id] !== undefined).map(p => <label key={p.id} className="flex cursor-pointer items-center gap-3 py-4">
        <img src={covers[p.id]} alt="" className="size-14 rounded-md object-cover" />
        <span className="min-w-0 flex-1"><span className="block font-semibold text-foreground">{p.title}</span><span className="text-sm text-muted-foreground">{money(prices[p.id] ?? 0)}</span></span>
        <Checkbox aria-label={p.title} checked={selected.includes(p.id)} disabled={selected.length === 1 && selected.includes(p.id)} onCheckedChange={checked => onChange(checked ? [...selected, p.id] : selected.filter(id => id !== p.id))} />
      </label>)}
    </div>
    {PACKAGES.every(p => prices[p.id] !== undefined) && <Button variant="outline" className="mt-3 h-auto w-full whitespace-normal py-3" onClick={() => onChange(['cookbook', 'prep', 'kit'])}>Get all three — {money(recovery ? 2799 : 3099)}</Button>}
    <div className="mt-5 flex items-end justify-between gap-3" aria-live="polite">
      <div><p className="text-sm text-muted-foreground">{selected.length === 1 ? 'Individual price · no extra discount' : `${selected.length} products · one payment`}</p>{quote.savings > 0 && <p className="mt-1 text-sm font-semibold text-primary">Save {money(quote.savings)} against buying separately</p>}</div>
      <p className="text-right"><span className="block text-xs text-muted-foreground">Before applicable tax</span><strong className="font-display text-3xl text-foreground" aria-label="Order total">{money(quote.total)}</strong></p>
    </div>
  </section>;
}