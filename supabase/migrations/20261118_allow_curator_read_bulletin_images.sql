-- Let curators preview finalized photos on active draft Bulletins while
-- keeping pending and unassociated Storage objects inaccessible.
CREATE POLICY "Bulletin images: storage curator read active finalized"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bulletin-images'
    AND public.is_curator()
    AND EXISTS (
      SELECT 1
        FROM public.bulletins AS bulletin
        JOIN public.bulletin_images AS image
          ON image.bulletin_id = bulletin.id
         AND image.image_path = storage.objects.name
       WHERE bulletin.id::text = (storage.foldername(storage.objects.name))[1]
         AND bulletin.lifecycle_state = 'active'
         AND image.upload_status = 'ready'
    )
  );
