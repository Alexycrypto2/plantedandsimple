import { createClient } from '@supabase/supabase-js';
import { ToolError, type ToolContext } from '@lovable.dev/mcp-js';

export async function ownerClient(ctx: ToolContext) {
  const token = ctx.getToken();
  const userId = ctx.getUserId();
  if (!ctx.isAuthenticated() || !token || !userId || !ctx.getClientId()) throw new ToolError('Sign in through the assistant connection first.');
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new ToolError('The site connection is not configured.');
  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.from('user_roles').select('role').eq('user_id', userId).eq('role', 'boss').maybeSingle();
  if (error || !data) throw new ToolError('Only the site owner can use these tools.');
  return db;
}