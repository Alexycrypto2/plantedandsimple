import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { requireBossFactory } from './studio.server';
const boss = requireBossFactory();
export const getPinProviders = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await boss(context.supabase, context.userId);
  const { pinProviderStatus } = await import('./pin-images.server'); return pinProviderStatus();
});
export const startPinPhoto = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((data: { prompt: string; provider?: 'magic-hour' | 'pixazo' | 'gemini' }) => z.object({ prompt: z.string().min(5).max(5000), provider: z.enum(['magic-hour', 'pixazo', 'gemini']).optional() }).parse(data))
  .handler(async ({ data, context }) => {
    await boss(context.supabase, context.userId);
    const { createPinImageJob } = await import('./pin-images.server');
    return { id: await createPinImageJob(data.prompt, context.userId, data.provider) };
  });
export const pollPinPhoto = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await boss(context.supabase, context.userId);
    const { advancePinImageJob } = await import('./pin-images.server'); return advancePinImageJob(data.id, context.userId);
  });
export const cancelPinPhoto = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await boss(context.supabase, context.userId);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from('pin_image_jobs').update({ status: 'cancelled' }).eq('id', data.id).eq('created_by', context.userId).in('status', ['queued', 'running']);
    if (error) throw new Error('Could not stop the image job.'); return { ok: true };
  });
export const uploadPinArtwork = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((data: { base64: string }) => z.object({ base64: z.string().max(28_000_000) }).parse(data))
  .handler(async ({ data, context }) => {
    await boss(context.supabase, context.userId);
    const { decodeMediaUpload } = await import('../library/media-upload.server');
    const decoded = decodeMediaUpload(data.base64, 'image/png');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const path = `pinterest/artwork/${crypto.randomUUID()}.png`;
    const { error } = await supabaseAdmin.storage.from('ai-images').upload(path, decoded.bytes, { contentType: decoded.type });
    if (error) throw new Error('Could not save the finished artwork.');
    const { SITE_URL } = await import('../seo');
    return { image_url: `${SITE_URL}/api/public/img/ai-images/${path}`, storage_path: path };
  });
