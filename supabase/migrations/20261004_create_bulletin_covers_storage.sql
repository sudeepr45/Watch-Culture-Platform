-- ============================================================================
-- MOERI & JEANNERET — BULLETIN COVER IMAGE STORAGE
-- Migration: 20261004_create_bulletin_covers_storage.sql
-- Description: Creates the public storage bucket and curator-only write policies
--              for Bulletin cover images.
-- ============================================================================

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'bulletin-covers',
  'bulletin-covers',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Bulletin covers: public read"
  ON storage.objects;
CREATE POLICY "Bulletin covers: public read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'bulletin-covers');

DROP POLICY IF EXISTS "Bulletin covers: curator insert"
  ON storage.objects;
CREATE POLICY "Bulletin covers: curator insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bulletin-covers'
    AND public.is_curator()
  );

DROP POLICY IF EXISTS "Bulletin covers: curator update"
  ON storage.objects;
CREATE POLICY "Bulletin covers: curator update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'bulletin-covers'
    AND public.is_curator()
  )
  WITH CHECK (
    bucket_id = 'bulletin-covers'
    AND public.is_curator()
  );

DROP POLICY IF EXISTS "Bulletin covers: curator delete"
  ON storage.objects;
CREATE POLICY "Bulletin covers: curator delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'bulletin-covers'
    AND public.is_curator()
  );
