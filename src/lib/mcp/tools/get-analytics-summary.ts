import { defineTool, ToolError } from '@lovable.dev/mcp-js';
import { ownerClient } from '../supabase';

export default defineTool({
  name: 'get_analytics_summary', title: 'Site Analytics Summary',
  description: 'Read all-time site-recorded page views, subscriber and download totals, purchases and published content counts. These are site records, not Google Analytics or Paddle revenue.',
  inputSchema: {}, annotations: { readOnlyHint: true },
  handler: async (_args, ctx) => {
    const db = await ownerClient(ctx);
    const metrics = [
      ['subscribers', 'subscribers'], ['free_guide_downloads', 'free_guide_downloads'],
      ['cookbook_purchase_records', 'cookbook_downloads'], ['prep_purchase_records', 'prep_purchases'],
      ['published_recipes', 'recipes'], ['published_posts', 'blog_posts'], ['page_views', 'analytics_events'],
    ] as const;
    const result: Record<string, number> = {};
    await Promise.all(metrics.map(async ([metric, table]) => {
      let query = db.from(table).select('id', { count: 'exact', head: true });
      if (metric.startsWith('published_')) query = query.eq('status', 'published');
      if (metric === 'page_views') query = query.eq('kind', 'page_view');
      const { count, error } = await query;
      if (error || count === null) throw new ToolError(`Could not read ${metric}; no total was invented.`);
      result[metric] = count;
    }));
    return { content: [{ type: 'text', text: JSON.stringify({ period: 'all_time', source: 'site_records', totals: result }) }] };
  },
});