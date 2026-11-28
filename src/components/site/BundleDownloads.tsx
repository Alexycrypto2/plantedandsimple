import { Button } from '@/components/ui/button';
import { PACKAGES, type PackageId } from '@/lib/bundle-offers';
import { getPaddleEnvironment } from '@/lib/paddle';
import cookbook from '@/assets/cookbook-mockup.jpg';
import prep from '@/assets/prep-system-cover.jpg';
import kit from '@/assets/kit-page-1.jpg';
const covers = { cookbook, prep, kit };
export function BundleDownloads({ products, transactionId }: { products: PackageId[]; transactionId: string }) {
  return <section className="text-left">
    <p className="text-sm font-semibold text-primary">Payment confirmed</p>
    <h1 className="mt-2 font-display text-3xl text-foreground">Your package is ready</h1>
    <div className="mt-6 divide-y divide-border">{PACKAGES.filter(p => products.includes(p.id)).map(p => {
      const href = p.id === 'prep' ? '/auth?next=/prep-app' : `/api/public/download/${p.id === 'kit' ? 'planning-kit' : 'cookbook'}?session_id=${encodeURIComponent(transactionId)}&env=${getPaddleEnvironment()}`;
      return <div key={p.id} className="flex items-center gap-4 py-5"><img src={covers[p.id]} alt="" className="w-20 rounded-md object-cover" /><div className="min-w-0 flex-1"><h2 className="font-display text-xl text-foreground">{p.title}</h2><Button asChild className="mt-3 h-auto whitespace-normal"><a href={href}>{p.id === 'prep' ? 'Access Meal Prep System' : p.id === 'kit' ? 'Download Planning Kit' : 'Download Cookbook'}</a></Button></div></div>;
    })}</div>
    {products.includes('prep') && <p className="mt-4 text-sm text-muted-foreground">Sign in with the email used for your purchase to access your Meal Prep System.</p>}
    <p className="mt-5 text-sm text-muted-foreground">Questions? <a href="mailto:support@plantedandsimple.com" className="underline">support@plantedandsimple.com</a></p>
  </section>;
}