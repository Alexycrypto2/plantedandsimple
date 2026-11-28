export type PackageId = 'cookbook' | 'prep' | 'kit';
export const PACKAGES: { id: PackageId; slug: string; title: string; priceId: string }[] = [
  { id: 'cookbook', slug: 'high-protein-cookbook', title: 'Premium High-Protein Cookbook', priceId: 'high_protein_cookbook_onetime' },
  { id: 'prep', slug: 'meal-prep-system', title: 'Meal Prep & Kitchen System', priceId: 'prep_system_onetime' },
  { id: 'kit', slug: 'planning-kit', title: 'Weekly Meal Planning Kit', priceId: 'planning_kit_onetime' },
];
export const BUNDLE_OFFERS = [
  { products: ['cookbook', 'prep'] as PackageId[], priceId: 'cookbook_prep_bundle_onetime', cents: 2799 },
  { products: ['cookbook', 'kit'] as PackageId[], priceId: 'cookbook_kit_bundle_onetime', cents: 1199 },
  { products: ['prep', 'kit'] as PackageId[], priceId: 'prep_kit_bundle_onetime', cents: 2699 },
  { products: ['cookbook', 'prep', 'kit'] as PackageId[], priceId: 'complete_bundle_onetime', cents: 3099 },
];
export const RECOVERY_PRICE = 'complete_bundle_recovery_onetime';
export function bundleOffer(selected: PackageId[]) {
  return BUNDLE_OFFERS.find(o => o.products.length === selected.length && o.products.every(p => selected.includes(p)));
}
export function packageTotal(selected: PackageId[], prices: Partial<Record<PackageId, number>>, recovery = false) {
  const subtotal = selected.reduce((sum, id) => sum + (prices[id] ?? 0), 0);
  const offer = bundleOffer(selected);
  const total = offer ? offer.cents - (recovery && selected.length === 3 ? 300 : 0) : subtotal;
  return { subtotal, total, savings: subtotal - total, priceId: offer ? (recovery && selected.length === 3 ? RECOVERY_PRICE : offer.priceId) : PACKAGES.find(p => p.id === selected[0])?.priceId };
}