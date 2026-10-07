-- Store Bulletin photographs as Storage objects linked through normalized rows.

CREATE TABLE public.bulletin_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulletin_id UUID NOT NULL REFERENCES public.bulletins(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bulletin_images_bulletin_sort_order_key UNIQUE (bulletin_id, sort_order)
);

-- The unique constraint creates the (bulletin_id, sort_order) index used by image queries.
ALTER TABLE public.bulletin_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bulletin images: public read published"
  ON public.bulletin_images
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bulletins
      WHERE public.bulletins.id = bulletin_images.bulletin_id
        AND public.bulletins.published_at IS NOT NULL
    )
  );

CREATE POLICY "Bulletin images: curator read all"
  ON public.bulletin_images
  FOR SELECT
  TO authenticated
  USING (public.is_curator());

CREATE POLICY "Bulletin images: curator insert"
  ON public.bulletin_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_curator());

CREATE POLICY "Bulletin images: curator update"
  ON public.bulletin_images
  FOR UPDATE
  TO authenticated
  USING (public.is_curator())
  WITH CHECK (public.is_curator());

CREATE POLICY "Bulletin images: curator delete"
  ON public.bulletin_images
  FOR DELETE
  TO authenticated
  USING (public.is_curator());

GRANT SELECT ON public.bulletin_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bulletin_images TO authenticated;

-- Keep unpublished images private; published images are served with short-lived signed URLs.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'bulletin-images',
  'bulletin-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Bulletin images: storage public read published"
  ON storage.objects;
CREATE POLICY "Bulletin images: storage public read published"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'bulletin-images'
    AND EXISTS (
      SELECT 1
      FROM public.bulletins
      WHERE public.bulletins.id::text = (storage.foldername(name))[1]
        AND public.bulletins.published_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Bulletin images: storage curator read"
  ON storage.objects;
CREATE POLICY "Bulletin images: storage curator read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bulletin-images'
    AND public.is_curator()
  );

DROP POLICY IF EXISTS "Bulletin images: storage curator insert"
  ON storage.objects;
CREATE POLICY "Bulletin images: storage curator insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bulletin-images'
    AND public.is_curator()
    AND EXISTS (
      SELECT 1
      FROM public.bulletins
      WHERE public.bulletins.id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Bulletin images: storage curator update"
  ON storage.objects;
CREATE POLICY "Bulletin images: storage curator update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'bulletin-images'
    AND public.is_curator()
  )
  WITH CHECK (
    bucket_id = 'bulletin-images'
    AND public.is_curator()
    AND EXISTS (
      SELECT 1
      FROM public.bulletins
      WHERE public.bulletins.id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Bulletin images: storage curator delete"
  ON storage.objects;
CREATE POLICY "Bulletin images: storage curator delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'bulletin-images'
    AND public.is_curator()
  );
