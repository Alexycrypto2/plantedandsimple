DROP POLICY IF EXISTS "Public reads ai-images" ON storage.objects;
CREATE POLICY "Admins read ai-images objects" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ai-images' AND public.has_role(auth.uid(), 'admin'));