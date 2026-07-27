UPDATE public.products
SET cover_image_url = '/products/high-protein-cookbook.jpg'
WHERE slug = 'high-protein-cookbook' AND (cover_image_url IS NULL OR cover_image_url = '');

CREATE INDEX IF NOT EXISTS idx_subscribers_subscribed_at ON public.subscribers (subscribed_at);
CREATE INDEX IF NOT EXISTS idx_subscribers_source ON public.subscribers (source);
CREATE INDEX IF NOT EXISTS idx_free_guide_downloads_email ON public.free_guide_downloads (lower(email));
CREATE INDEX IF NOT EXISTS idx_cookbook_downloads_email ON public.cookbook_downloads (lower(email));
CREATE INDEX IF NOT EXISTS idx_cookbook_downloads_created_at ON public.cookbook_downloads (created_at);