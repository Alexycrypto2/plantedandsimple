import { BUNDLE_OFFERS, PACKAGES, RECOVERY_PRICE, type PackageId } from './bundle-offers';
import { gatewayFetch, type PaddleEnv } from './paddle.server';

/** Entitlements come from actual paid price items, never editable checkout labels. */
export async function purchasedProducts(tx: any, environment: PaddleEnv): Promise<PackageId[]> {
  const found = new Set<PackageId>();
  for (const item of tx?.items ?? []) {
    let price = item.price;
    let external = price?.import_meta?.external_id ?? price?.importMeta?.externalId;
    if (!external && price?.id) {
      const res = await gatewayFetch(environment, `/prices/${encodeURIComponent(price.id)}`);
      if (!res.ok) throw new Error('Could not verify purchased items');
      price = (await res.json()).data;
      external = price?.import_meta?.external_id ?? price?.importMeta?.externalId;
    }
    const single = PACKAGES.find(p => p.priceId === external);
    const bundle = BUNDLE_OFFERS.find(p => p.priceId === external);
    if (single) found.add(single.id);
    if (bundle) bundle.products.forEach(p => found.add(p));
    if (external === RECOVERY_PRICE) PACKAGES.forEach(p => found.add(p.id));
  }
  return PACKAGES.filter(p => found.has(p.id)).map(p => p.id);
}