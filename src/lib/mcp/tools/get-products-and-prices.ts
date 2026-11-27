import { defineTool, ToolError } from '@lovable.dev/mcp-js';
import { ownerClient } from '../supabase';

export default defineTool({
  name: 'get_products_and_prices', title: 'Products and Current Prices',
  description: 'Read product catalog prices and the current flagship checkout pricing in minor currency units, without guessing prices or exposing private download links.',
  inputSchema: {}, annotations: { readOnlyHint: true },
  handler: async (_args, ctx) => {
    const db = await ownerClient(ctx);
    const [products, pricing] = await Promise.all([
      db.from('products').select('id,title,slug,status,description,price_cents,compare_at_cents,currency').order('title').limit(200),
      db.from('pricing_settings').select('price_cents,compare_at_cents,currency').eq('id', true).maybeSingle(),
    ]);
    if (products.error || pricing.error) throw new ToolError('Current prices could not be read; no fallback prices were invented.');
    return { content: [{ type: 'text', text: JSON.stringify({ products: products.data, flagship_checkout_pricing: pricing.data, price_unit: 'minor_currency_units', catalog_limit: 200 }) }] };
  },
});