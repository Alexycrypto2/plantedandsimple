
CREATE POLICY "Anyone can upload a review photo"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'review-photos');
