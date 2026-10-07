-- Serialize Bulletin image reservations with Bulletin deletion on the server.
ALTER TABLE public.bulletins
  ADD COLUMN lifecycle_state TEXT NOT NULL DEFAULT 'active',
  ADD CONSTRAINT bulletins_lifecycle_state_check
    CHECK (lifecycle_state IN ('active', 'deleting'));

ALTER TABLE public.bulletin_images
  ADD COLUMN upload_id UUID,
  ADD COLUMN upload_status TEXT NOT NULL DEFAULT 'ready',
  ADD CONSTRAINT bulletin_images_upload_status_check
    CHECK (upload_status IN ('pending', 'ready')),
  ADD CONSTRAINT bulletin_images_pending_upload_id_check
    CHECK (upload_status = 'ready' OR upload_id IS NOT NULL),
  ADD CONSTRAINT bulletin_images_bulletin_upload_id_key
    UNIQUE (bulletin_id, upload_id);

-- Public reads only expose fully uploaded images on active, published Bulletins.
DROP POLICY IF EXISTS "Allow public read access for published bulletins"
  ON public.bulletins;
CREATE POLICY "Allow public read access for published bulletins"
  ON public.bulletins
  FOR SELECT
  TO public
  USING (published_at IS NOT NULL AND lifecycle_state = 'active');

DROP POLICY IF EXISTS "Allow curators to read bulletins"
  ON public.bulletins;
CREATE POLICY "Allow curators to read bulletins"
  ON public.bulletins
  FOR SELECT
  TO authenticated
  USING (
    (published_at IS NOT NULL AND lifecycle_state = 'active')
    OR public.is_curator()
  );

DROP POLICY IF EXISTS "Allow curators to delete bulletins"
  ON public.bulletins;

-- Lifecycle state is writable only by the security-definer lifecycle functions.
REVOKE INSERT, UPDATE, DELETE ON public.bulletins FROM PUBLIC, anon, authenticated;
GRANT INSERT (
  slug,
  title,
  body,
  category,
  cover_image,
  author_id,
  related_watch_id,
  published_at,
  era
) ON public.bulletins TO authenticated;
GRANT UPDATE (
  slug,
  title,
  body,
  category,
  cover_image,
  related_watch_id,
  published_at,
  era
) ON public.bulletins TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.bulletins_bulletin_number_seq TO authenticated;

-- Image row lifecycle writes must pass through the atomic reservation/finalization RPCs.
REVOKE INSERT, UPDATE, DELETE ON public.bulletin_images FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.bulletin_images TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_bulletin_image_upload_reserved(
  p_bulletin_folder TEXT,
  p_image_path TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.is_curator()
    AND EXISTS (
      SELECT 1
        FROM public.bulletins AS bulletin
        JOIN public.bulletin_images AS image
          ON image.bulletin_id = bulletin.id
       WHERE bulletin.id::TEXT = p_bulletin_folder
         AND bulletin.lifecycle_state = 'active'
         AND image.image_path = p_image_path
         AND image.upload_status = 'pending'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_bulletin_image_deletion_path(
  p_bulletin_folder TEXT,
  p_image_path TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.is_curator()
    AND EXISTS (
      SELECT 1
        FROM public.bulletins AS bulletin
        JOIN public.bulletin_images AS image
          ON image.bulletin_id = bulletin.id
       WHERE bulletin.id::TEXT = p_bulletin_folder
         AND bulletin.lifecycle_state = 'deleting'
         AND image.image_path = p_image_path
    );
$$;

REVOKE EXECUTE ON FUNCTION public.is_bulletin_image_upload_reserved(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_bulletin_image_deletion_path(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_bulletin_image_upload_reserved(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_bulletin_image_deletion_path(TEXT, TEXT) TO authenticated;

DROP POLICY IF EXISTS "Bulletin images: public read published"
  ON public.bulletin_images;
CREATE POLICY "Bulletin images: public read published"
  ON public.bulletin_images
  FOR SELECT
  TO anon, authenticated
  USING (
    upload_status = 'ready'
    AND EXISTS (
      SELECT 1
      FROM public.bulletins
      WHERE public.bulletins.id = bulletin_images.bulletin_id
        AND public.bulletins.published_at IS NOT NULL
        AND public.bulletins.lifecycle_state = 'active'
    )
  );

DROP POLICY IF EXISTS "Bulletin images: curator read all"
  ON public.bulletin_images;
CREATE POLICY "Bulletin images: curator read ready"
  ON public.bulletin_images
  FOR SELECT
  TO authenticated
  USING (
    public.is_curator()
    AND upload_status = 'ready'
    AND EXISTS (
      SELECT 1
      FROM public.bulletins
      WHERE public.bulletins.id = bulletin_images.bulletin_id
        AND public.bulletins.lifecycle_state = 'active'
    )
  );

DROP POLICY IF EXISTS "Bulletin images: curator insert" ON public.bulletin_images;
DROP POLICY IF EXISTS "Bulletin images: curator update" ON public.bulletin_images;
DROP POLICY IF EXISTS "Bulletin images: curator delete" ON public.bulletin_images;

-- Never allow public signed URLs for unassociated, pending, or unrelated objects.
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
      FROM public.bulletins AS bulletin
      JOIN public.bulletin_images AS image
        ON image.bulletin_id = bulletin.id
       AND image.image_path = storage.objects.name
      WHERE bulletin.id::text = (storage.foldername(storage.objects.name))[1]
        AND bulletin.published_at IS NOT NULL
        AND bulletin.lifecycle_state = 'active'
        AND image.upload_status = 'ready'
    )
  );

DROP POLICY IF EXISTS "Bulletin images: storage curator update"
  ON storage.objects;
DROP POLICY IF EXISTS "Bulletin images: storage curator read"
  ON storage.objects;
DROP POLICY IF EXISTS "Bulletin images: storage curator insert"
  ON storage.objects;
CREATE POLICY "Bulletin images: storage curator insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bulletin-images'
    AND public.is_bulletin_image_upload_reserved(
      (storage.foldername(storage.objects.name))[1],
      storage.objects.name
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
    AND public.is_bulletin_image_deletion_path(
      (storage.foldername(storage.objects.name))[1],
      storage.objects.name
    )
  );

CREATE OR REPLACE FUNCTION public.reserve_bulletin_image(
  p_bulletin_id UUID,
  p_upload_id UUID,
  p_image_path TEXT,
  p_sort_order INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lifecycle_state TEXT;
  v_existing public.bulletin_images%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_curator() THEN
    RAISE EXCEPTION 'Curator access is required.' USING ERRCODE = '42501';
  END IF;

  IF p_bulletin_id IS NULL OR p_upload_id IS NULL OR p_sort_order IS NULL OR p_sort_order < 0 THEN
    RAISE EXCEPTION 'A valid Bulletin, photo ID, and order are required.';
  END IF;

  IF p_image_path IS NULL OR p_image_path NOT IN (
    p_bulletin_id::TEXT || '/' || p_upload_id::TEXT || '.jpg',
    p_bulletin_id::TEXT || '/' || p_upload_id::TEXT || '.png',
    p_bulletin_id::TEXT || '/' || p_upload_id::TEXT || '.webp'
  ) THEN
    RAISE EXCEPTION 'The photo path does not match its Bulletin and upload IDs.';
  END IF;

  SELECT bulletin.lifecycle_state
    INTO v_lifecycle_state
    FROM public.bulletins AS bulletin
   WHERE bulletin.id = p_bulletin_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bulletin not found.';
  END IF;
  IF v_lifecycle_state <> 'active' THEN
    RAISE EXCEPTION 'This Bulletin is being deleted and cannot accept photos.';
  END IF;

  SELECT image.*
    INTO v_existing
    FROM public.bulletin_images AS image
   WHERE image.bulletin_id = p_bulletin_id
     AND image.upload_id = p_upload_id
   FOR UPDATE;

  IF FOUND THEN
    IF v_existing.image_path <> p_image_path OR v_existing.sort_order <> p_sort_order THEN
      RAISE EXCEPTION 'The photo ID is already reserved for a different path or order.';
    END IF;
    RETURN v_existing.upload_status;
  END IF;

  PERFORM 1
    FROM public.bulletin_images AS image
   WHERE image.bulletin_id = p_bulletin_id
     AND image.sort_order = p_sort_order
   FOR UPDATE;
  IF FOUND THEN
    RAISE EXCEPTION 'A different photo is already reserved for this order.';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM storage.objects AS object
     WHERE object.bucket_id = 'bulletin-images'
       AND object.name = p_image_path
  ) THEN
    RAISE EXCEPTION 'A Storage object already exists without this database reservation; it was left untouched.';
  END IF;

  INSERT INTO public.bulletin_images (
    bulletin_id,
    upload_id,
    image_path,
    sort_order,
    upload_status
  ) VALUES (
    p_bulletin_id,
    p_upload_id,
    p_image_path,
    p_sort_order,
    'pending'
  );

  RETURN 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_bulletin_images(
  p_bulletin_id UUID,
  p_upload_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lifecycle_state TEXT;
  v_requested_count INTEGER;
  v_found_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_curator() THEN
    RAISE EXCEPTION 'Curator access is required.' USING ERRCODE = '42501';
  END IF;

  IF p_upload_ids IS NULL OR cardinality(p_upload_ids) = 0 THEN
    RAISE EXCEPTION 'At least one photo reservation is required.';
  END IF;

  SELECT bulletin.lifecycle_state
    INTO v_lifecycle_state
    FROM public.bulletins AS bulletin
   WHERE bulletin.id = p_bulletin_id
   FOR UPDATE;

  IF NOT FOUND OR v_lifecycle_state <> 'active' THEN
    RAISE EXCEPTION 'Bulletin is unavailable for photo finalization.';
  END IF;

  SELECT count(DISTINCT requested.upload_id)
    INTO v_requested_count
    FROM unnest(p_upload_ids) AS requested(upload_id);

  IF v_requested_count <> cardinality(p_upload_ids) THEN
    RAISE EXCEPTION 'Duplicate photo IDs were supplied.';
  END IF;

  SELECT count(*)
    INTO v_found_count
    FROM public.bulletin_images AS image
   WHERE image.bulletin_id = p_bulletin_id
     AND image.upload_id = ANY (p_upload_ids);

  IF v_found_count <> cardinality(p_upload_ids) THEN
    RAISE EXCEPTION 'A photo reservation is missing.';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.bulletin_images AS image
     WHERE image.bulletin_id = p_bulletin_id
       AND image.upload_id = ANY (p_upload_ids)
       AND NOT EXISTS (
         SELECT 1
           FROM storage.objects AS object
          WHERE object.bucket_id = 'bulletin-images'
            AND object.name = image.image_path
       )
  ) THEN
    RAISE EXCEPTION 'A photo object has not finished uploading.';
  END IF;

  UPDATE public.bulletin_images
     SET upload_status = 'ready'
   WHERE bulletin_id = p_bulletin_id
     AND upload_id = ANY (p_upload_ids);

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.inspect_bulletin_image_upload(
  p_bulletin_id UUID,
  p_upload_id UUID,
  p_image_path TEXT,
  p_sort_order INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_curator() THEN
    RAISE EXCEPTION 'Curator access is required.' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'image_path', image.image_path,
    'sort_order', image.sort_order,
    'upload_status', image.upload_status,
    'object_exists', object.name IS NOT NULL,
    'object_bulletin_id', object.metadata ->> 'bulletin_id',
    'object_upload_id', object.metadata ->> 'photo_upload_id'
  )
    INTO v_result
    FROM public.bulletin_images AS image
    LEFT JOIN storage.objects AS object
      ON object.bucket_id = 'bulletin-images'
     AND object.name = image.image_path
   WHERE image.bulletin_id = p_bulletin_id
     AND image.upload_id = p_upload_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'No database photo reservation exists for this upload.';
  END IF;
  IF v_result ->> 'image_path' <> p_image_path
     OR (v_result ->> 'sort_order')::INTEGER <> p_sort_order THEN
    RAISE EXCEPTION 'The photo reservation does not match the requested path and order.';
  END IF;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_bulletin_deletion_image_paths(p_bulletin_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lifecycle_state TEXT;
  v_paths TEXT[];
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_curator() THEN
    RAISE EXCEPTION 'Curator access is required.' USING ERRCODE = '42501';
  END IF;

  SELECT bulletin.lifecycle_state
    INTO v_lifecycle_state
    FROM public.bulletins AS bulletin
   WHERE bulletin.id = p_bulletin_id;

  IF NOT FOUND OR v_lifecycle_state <> 'deleting' THEN
    RAISE EXCEPTION 'Bulletin deletion has not been established.';
  END IF;

  SELECT COALESCE(array_agg(image.image_path ORDER BY image.sort_order), ARRAY[]::TEXT[])
    INTO v_paths
    FROM public.bulletin_images AS image
   WHERE image.bulletin_id = p_bulletin_id;

  RETURN v_paths;
END;
$$;

CREATE OR REPLACE FUNCTION public.begin_bulletin_deletion(p_bulletin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lifecycle_state TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_curator() THEN
    RAISE EXCEPTION 'Curator access is required.' USING ERRCODE = '42501';
  END IF;

  SELECT bulletin.lifecycle_state
    INTO v_lifecycle_state
    FROM public.bulletins AS bulletin
   WHERE bulletin.id = p_bulletin_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bulletin not found.';
  END IF;

  IF v_lifecycle_state = 'deleting' THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.bulletin_images AS image
     WHERE image.bulletin_id = p_bulletin_id
       AND image.upload_status = 'pending'
  ) THEN
    RETURN FALSE;
  END IF;

  UPDATE public.bulletins
     SET lifecycle_state = 'deleting'
   WHERE id = p_bulletin_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_bulletin_deletion(p_bulletin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lifecycle_state TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_curator() THEN
    RAISE EXCEPTION 'Curator access is required.' USING ERRCODE = '42501';
  END IF;

  SELECT bulletin.lifecycle_state
    INTO v_lifecycle_state
    FROM public.bulletins AS bulletin
   WHERE bulletin.id = p_bulletin_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  IF v_lifecycle_state <> 'deleting' THEN
    RAISE EXCEPTION 'Bulletin deletion has not been established.';
  END IF;
  IF EXISTS (
    SELECT 1
      FROM public.bulletin_images AS image
     WHERE image.bulletin_id = p_bulletin_id
       AND image.upload_status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Bulletin still has an in-progress photo upload.';
  END IF;
  IF EXISTS (
    SELECT 1
      FROM public.bulletin_images AS image
      JOIN storage.objects AS object
        ON object.bucket_id = 'bulletin-images'
       AND object.name = image.image_path
     WHERE image.bulletin_id = p_bulletin_id
  ) THEN
    RAISE EXCEPTION 'Bulletin still has Storage objects to remove.';
  END IF;

  DELETE FROM public.bulletins WHERE id = p_bulletin_id;
  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_bulletin_image(UUID, UUID, TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_bulletin_images(UUID, UUID[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.inspect_bulletin_image_upload(UUID, UUID, TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_bulletin_deletion_image_paths(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.begin_bulletin_deletion(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finish_bulletin_deletion(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_bulletin_image(UUID, UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_bulletin_images(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inspect_bulletin_image_upload(UUID, UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bulletin_deletion_image_paths(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.begin_bulletin_deletion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_bulletin_deletion(UUID) TO authenticated;
