import { getConfig } from '../settings.server';
import { PHOTO_STYLE } from './studio.server';
import { canFallbackImage } from './pin-design';
import { decodeMediaUpload } from '../library/media-upload.server';
export type PinImageProvider = 'magic-hour' | 'pixazo' | 'gemini';
class ProviderError extends Error {
  constructor(message: string, public status?: number, public refused = false) { super(message); }
}
async function providerJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  let body: any; try { body = await response.json(); } catch { body = {}; }
  const raw = typeof body.error === 'string' ? body.error : body.error?.message ?? body.message;
  if (!response.ok) throw new ProviderError(String(raw ?? `Image provider returned ${response.status}`).slice(0, 350), response.status);
  if (body.flagged || /moderation|content.policy|safety|refus/i.test(String(raw ?? ''))) throw new ProviderError('The provider declined this image request.', response.status, true);
  return body;
}
export async function pinProviderStatus() {
  const [magic, pixazo, gemini] = await Promise.all([getConfig('MAGIC_HOUR_API_KEY'), getConfig('PIXAZO_API_KEY'), getConfig('GEMINI_API_KEY')]);
  return [
    { id: 'magic-hour' as const, name: 'Magic Hour', configured: Boolean(magic), model: 'Provider recommended' },
    { id: 'pixazo' as const, name: 'Pixazo', configured: Boolean(pixazo), model: 'GPT Image 2.5 Sunburst' },
    { id: 'gemini' as const, name: 'Gemini', configured: Boolean(gemini), model: await getConfig('GEMINI_IMAGE_MODEL') },
  ];
}
export async function createPinImageJob(prompt: string, userId: string, provider?: PinImageProvider) {
  const available = (await pinProviderStatus()).filter(row => row.configured).map(row => row.id);
  const chain = provider ? [provider, ...available.filter(id => id !== provider)] : available;
  if (!chain.length) throw new Error('Add an image provider key in Connections before generating photography.');
  if (provider && !available.includes(provider)) throw new Error('This image provider is not connected.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.from('pin_image_jobs').insert({ created_by: userId, prompt: `${prompt}. Vertical food photography, no lettering, no graphics. ${PHOTO_STYLE}`, providers: chain }).select('id').single();
  if (error || !data) throw new Error('Could not start the image job.');
  return data.id;
}
export async function advancePinImageJob(id: string, userId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: job, error } = await supabaseAdmin.from('pin_image_jobs').select('*').eq('id', id).eq('created_by', userId).single();
  if (error || !job) throw new Error('Image job not found.');
  const providers = job.providers as PinImageProvider[];
  const provider = providers[job.provider_index];
  const view = (row: typeof job) => ({ id: row.id, status: row.status, image_url: row.image_url, storage_path: row.storage_path, provider: providers[row.provider_index], credits: row.credits_charged, error: row.error });
  if (['complete', 'failed', 'cancelled'].includes(job.status)) return view(job);
  if (!provider) throw new Error('No configured image providers remain.');
  // Compare-and-set prevents duplicate charged submissions from overlapping polls.
  const lease = new Date().toISOString();
  const { data: claimed } = await supabaseAdmin.from('pin_image_jobs').update({ updated_at: lease }).eq('id', id).eq('updated_at', job.updated_at).select('id').maybeSingle();
  if (!claimed) return view(job);
  const update = async (patch: Record<string, unknown>) => {
    const { data, error: saveError } = await supabaseAdmin.from('pin_image_jobs').update(patch).eq('id', id).eq('status', job.status).select('*').maybeSingle();
    if (saveError) throw new Error('Could not save image progress.');
    return data ? view(data) : { ...view(job), status: 'cancelled' };
  };
  try {
    let image: string | undefined;
    let credits = job.credits_charged;
    if (provider === 'magic-hour') {
      const key = await getConfig('MAGIC_HOUR_API_KEY'); if (!key) throw new ProviderError('Magic Hour key is missing.', 401);
      const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
      if (!job.provider_job_id) {
        const result = await providerJson('https://api.magichour.ai/v1/ai-image-generator', { method: 'POST', headers, body: JSON.stringify({ image_count: 1, aspect_ratio: '9:16', resolution: '1k', model: 'default', style: { prompt: job.prompt, tool: 'ai-photo-generator' } }) });
        if (!result.id) throw new ProviderError('Magic Hour returned no project identifier.');
        return update({ provider_job_id: result.id, status: 'running', credits_charged: result.credits_charged ?? null });
      }
      const result = await providerJson(`https://api.magichour.ai/v1/image-projects/${encodeURIComponent(job.provider_job_id)}`, { headers });
      if (result.status === 'error' || result.status === 'failed') throw new ProviderError(String(result.error?.message ?? result.error ?? 'Magic Hour image failed'), 500, /moderation|safety|content/i.test(JSON.stringify(result.error)));
      if (result.status !== 'complete') return view(job);
      image = result.downloads?.[0]?.url; credits = result.credits_charged ?? credits;
    } else if (provider === 'pixazo') {
      const key = await getConfig('PIXAZO_API_KEY'); if (!key) throw new ProviderError('Pixazo key is missing.', 401);
      const headers = { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/json' };
      if (!job.provider_job_id) {
        const result = await providerJson('https://gateway.pixazo.ai/gpt-image-2-5-sunburst/v1/text-to-image', { method: 'POST', headers, body: JSON.stringify({ prompt: job.prompt }) });
        if (!result.request_id) throw new ProviderError('Pixazo returned no request identifier.');
        return update({ provider_job_id: result.request_id, status: 'running', credits_charged: null });
      }
      const result = await providerJson(`https://gateway.pixazo.ai/v2/requests/status/${encodeURIComponent(job.provider_job_id)}`, { headers });
      if (result.status === 'FAILED') throw new ProviderError(String(result.error?.message ?? result.error ?? 'Pixazo image failed'), 500, /moderation|safety|content/i.test(JSON.stringify(result.error)));
      if (result.status !== 'COMPLETED') return view(job);
      image = result.output?.media_url?.[0];
    } else {
      const key = await getConfig('GEMINI_API_KEY');
      const model = await getConfig('GEMINI_IMAGE_MODEL');
      if (!key || !model) throw new ProviderError('Select an available Gemini image model in Settings.', 400);
      const result = await providerJson(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.replace(/^google\//, ''))}:generateContent`, { method: 'POST', headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: job.prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }) });
      if (result.promptFeedback?.blockReason || ['SAFETY', 'IMAGE_SAFETY', 'PROHIBITED_CONTENT'].includes(result.candidates?.[0]?.finishReason)) throw new ProviderError('Gemini declined this image request.', 200, true);
      const inline = result.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData?.data)?.inlineData;
      if (!inline) throw new ProviderError('Gemini returned no image.');
      const decoded = decodeMediaUpload(inline.data, inline.mimeType || 'image/png');
      const path = `pinterest/photos/${crypto.randomUUID()}.${decoded.ext}`;
      const uploaded = await supabaseAdmin.storage.from('ai-images').upload(path, decoded.bytes, { contentType: decoded.type });
      if (uploaded.error) throw new Error('Could not store the generated photograph.');
      return update({ status: 'complete', image_url: `/api/public/img/ai-images/${path}`, storage_path: path });
    }
    if (!image || !image.startsWith('https://')) throw new ProviderError('The image provider completed without an image.');
    const response = await fetch(image);
    if (!response.ok) throw new ProviderError('Could not retrieve the generated photograph.', response.status);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 20 * 1024 * 1024) throw new Error('Generated photograph is too large.');
    const decoded = decodeMediaUpload(Buffer.from(bytes).toString('base64'), (response.headers.get('Content-Type') ?? 'image/png').split(';')[0]);
    const path = `pinterest/photos/${crypto.randomUUID()}.${decoded.ext}`;
    const uploaded = await supabaseAdmin.storage.from('ai-images').upload(path, decoded.bytes, { contentType: decoded.type });
    if (uploaded.error) throw new Error('Could not store the generated photograph.');
    return update({ status: 'complete', image_url: `/api/public/img/ai-images/${path}`, storage_path: path, credits_charged: credits });
  } catch (error) {
    const failure = error instanceof ProviderError ? error : new ProviderError('Image processing failed. Please try a new request.');
    const next = canFallbackImage(failure.status, failure.refused) && job.provider_index + 1 < providers.length;
    const attempts = [...(Array.isArray(job.attempts) ? job.attempts : []), { provider, status: failure.status ?? null, message: failure.message, at: lease }];
    return update(next ? { provider_index: job.provider_index + 1, provider_job_id: null, status: 'queued', attempts, credits_charged: null }
      : { status: 'failed', error: `${provider}: ${failure.message}`, attempts });
  }
}
