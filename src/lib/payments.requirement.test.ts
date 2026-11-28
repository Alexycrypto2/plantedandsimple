import { beforeEach, describe, expect, it, vi } from 'vitest';
const provider = vi.hoisted(() => ({ gateway: vi.fn() }));
vi.mock('@tanstack/react-start', () => ({ createServerFn: () => ({ inputValidator: () => ({ handler: (handler: any) => handler }) }) }));
vi.mock('@/lib/paddle.server', () => ({ gatewayFetch: provider.gateway }));
import { verifyCookbookPayment } from './payments.functions';
beforeEach(() => provider.gateway.mockReset());
describe('A bundle purchase unlocks only the products paid for', () => {
  it('A buyer of all three packages receives cookbook, prep and kit access', async () => {
    provider.gateway.mockResolvedValue(Response.json({ data: { status: 'completed', items: [{ price: { import_meta: { external_id: 'complete_bundle_onetime' } } }] } }));
    const result = await verifyCookbookPayment({ data: { transactionId: 'txn_bundle', environment: 'sandbox' } });
    expect(result).toMatchObject({ paid: true, products: ['cookbook', 'prep', 'kit'] });
  });
  it('A buyer of cookbook and kit receives no prep access', async () => {
    provider.gateway.mockResolvedValue(Response.json({ data: { status: 'paid', items: [{ price: { import_meta: { external_id: 'cookbook_kit_bundle_onetime' } } }] } }));
    const result = await verifyCookbookPayment({ data: { transactionId: 'txn_pair', environment: 'sandbox' } });
    expect(result).toMatchObject({ paid: true, products: ['cookbook', 'kit'] });
  });
  it('A buyer cannot claim the full package by changing checkout labels', async () => {
    provider.gateway.mockResolvedValue(Response.json({ data: { status: 'completed', custom_data: { productSlug: 'bundle-full' }, items: [{ price: { import_meta: { external_id: 'planning_kit_onetime' } } }] } }));
    const result = await verifyCookbookPayment({ data: { transactionId: 'txn_kit', environment: 'sandbox' } });
    expect(result).toMatchObject({ paid: true, products: ['kit'] });
  });
});