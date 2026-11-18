-- Serialize per-image deletion with uploads and whole-Bulletin deletion.
-- A deleted-image tombstone prevents a stale upload retry from recreating the
-- same attachment after the original row has been reconciled away.

ALTER TABLE public.bulletin_images
  ADD COLUMN deletion_pending BOOLEAN NOT NULL DEFAULT FALSE;

-- Remove the former escape hatch if it exists from an earlier test run.
DROP FUNCTION IF EXISTS public.cancel_bulletin_image_deletion(UUID, UUID);

CREATE TABLE public.bulletin_image_deletion_tombstones (
  bulletin_id UUID NOT NULL REFERENCES public.bulletins(id) ON DELETE CASCADE,
  image_id UUID NOT NULL,
  upload_id UUID,
  image_path TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bulletin_image_deletion_tombstones_pkey PRIMARY KEY (bulletin_id, image_id),
  CONSTRAINT bulletin_image_deletion_tombstones_path_key UNIQUE (bulletin_id, image_path),
  CONSTRAINT bulletin_image_deletion_tombstones_upload_key UNIQUE (bulletin_id, upload_id)
);
ALTER TABLE public.bulletin_image_deletion_tombstones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bulletin_image_deletion_tombstones FROM PUBLIC, anon, authenticated;

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
        JOIN public.bulletin_images AS image ON image.bulletin_id = bulletin.id
       WHERE bulletin.id::TEXT = p_bulletin_folder
         AND bulletin.lifecycle_state = 'active'
         AND image.image_path = p_image_path
         AND image.upload_status = 'pending'
         AND NOT image.deletion_pending
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
        JOIN public.bulletin_images AS image ON image.bulletin_id = bulletin.id
       WHERE bulletin.id::TEXT = p_bulletin_folder
         AND image.image_path = p_image_path
         AND (
           bulletin.lifecycle_state = 'deleting'
           OR (bulletin.lifecycle_state = 'active' AND image.deletion_pending)
         )
    );
$$;

DROP POLICY IF EXISTS "Bulletin images: public read published" ON public.bulletin_images;
CREATE POLICY "Bulletin images: public read published"
  ON public.bulletin_images FOR SELECT TO anon, authenticated
  USING (
    upload_status = 'ready' AND NOT deletion_pending
    AND EXISTS (
      SELECT 1 FROM public.bulletins
       WHERE public.bulletins.id = bulletin_images.bulletin_id
         AND public.bulletins.published_at IS NOT NULL
         AND public.bulletins.lifecycle_state = 'active'
    )
  );

DROP POLICY IF EXISTS "Bulletin images: curator read ready" ON public.bulletin_images;
CREATE POLICY "Bulletin images: curator read ready"
  ON public.bulletin_images FOR SELECT TO authenticated
  USING (
    public.is_curator() AND upload_status = 'ready'
    AND EXISTS (
      SELECT 1 FROM public.bulletins
       WHERE public.bulletins.id = bulletin_images.bulletin_id
         AND public.bulletins.lifecycle_state = 'active'
    )
  );

DROP POLICY IF EXISTS "Bulletin images: storage public read published" ON storage.objects;
CREATE POLICY "Bulletin images: storage public read published"
  ON storage.objects FOR SELECT TO public
  USING (
    bucket_id = 'bulletin-images'
    AND EXISTS (
      SELECT 1
        FROM public.bulletins AS bulletin
        JOIN public.bulletin_images AS image
          ON image.bulletin_id = bulletin.id AND image.image_path = storage.objects.name
       WHERE bulletin.id::text = (storage.foldername(storage.objects.name))[1]
         AND bulletin.published_at IS NOT NULL
         AND bulletin.lifecycle_state = 'active'
         AND image.upload_status = 'ready'
         AND NOT image.deletion_pending
    )
  );

-- Keep the existing curator preview policy's scope and permit it to preview a
-- pending removal while that Storage object still exists for recovery.
DROP POLICY IF EXISTS "Bulletin images: storage curator read active finalized" ON storage.objects;
CREATE POLICY "Bulletin images: storage curator read active finalized"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'bulletin-images'
    AND public.is_curator()
    AND EXISTS (
      SELECT 1
        FROM public.bulletins AS bulletin
        JOIN public.bulletin_images AS image
          ON image.bulletin_id = bulletin.id AND image.image_path = storage.objects.name
       WHERE bulletin.id::text = (storage.foldername(storage.objects.name))[1]
         AND bulletin.lifecycle_state = 'active'
         AND image.upload_status = 'ready'
    )
  );

CREATE OR REPLACE FUNCTION public.reserve_bulletin_image(
  p_bulletin_id UUID, p_upload_id UUID, p_image_path TEXT, p_sort_order INTEGER
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

  SELECT bulletin.lifecycle_state INTO v_lifecycle_state
    FROM public.bulletins AS bulletin WHERE bulletin.id = p_bulletin_id FOR UPDATE;
  IF NOT FOUND OR v_lifecycle_state <> 'active' THEN
    RAISE EXCEPTION 'Bulletin is unavailable for photo uploads.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.bulletin_image_deletion_tombstones AS tombstone
     WHERE tombstone.bulletin_id = p_bulletin_id
       AND (tombstone.upload_id = p_upload_id OR tombstone.image_path = p_image_path)
  ) THEN
    RAISE EXCEPTION 'This photo upload ID has already been deleted and cannot be reused.';
  END IF;

  SELECT image.* INTO v_existing FROM public.bulletin_images AS image
   WHERE image.bulletin_id = p_bulletin_id AND image.upload_id = p_upload_id FOR UPDATE;
  IF FOUND THEN
    IF v_existing.image_path <> p_image_path OR v_existing.sort_order <> p_sort_order THEN
      RAISE EXCEPTION 'The photo ID is already reserved for a different path or order.';
    END IF;
    IF v_existing.deletion_pending THEN
      RAISE EXCEPTION 'This photo is being removed and cannot be uploaded again.';
    END IF;
    RETURN v_existing.upload_status;
  END IF;

  PERFORM 1 FROM public.bulletin_images AS image
   WHERE image.bulletin_id = p_bulletin_id AND image.sort_order = p_sort_order FOR UPDATE;
  IF FOUND THEN RAISE EXCEPTION 'A different photo is already reserved for this order.'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects AS object
              WHERE object.bucket_id = 'bulletin-images' AND object.name = p_image_path) THEN
    RAISE EXCEPTION 'A Storage object already exists without this database reservation; it was left untouched.';
  END IF;
  INSERT INTO public.bulletin_images (bulletin_id, upload_id, image_path, sort_order, upload_status)
  VALUES (p_bulletin_id, p_upload_id, p_image_path, p_sort_order, 'pending');
  RETURN 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_bulletin_images(p_bulletin_id UUID, p_upload_ids UUID[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_lifecycle_state TEXT; v_requested_count INTEGER; v_found_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_curator() THEN
    RAISE EXCEPTION 'Curator access is required.' USING ERRCODE = '42501';
  END IF;
  IF p_upload_ids IS NULL OR cardinality(p_upload_ids) = 0 THEN
    RAISE EXCEPTION 'At least one photo reservation is required.';
  END IF;
  SELECT bulletin.lifecycle_state INTO v_lifecycle_state
    FROM public.bulletins AS bulletin WHERE bulletin.id = p_bulletin_id FOR UPDATE;
  IF NOT FOUND OR v_lifecycle_state <> 'active' THEN
    RAISE EXCEPTION 'Bulletin is unavailable for photo finalization.';
  END IF;
  PERFORM 1 FROM public.bulletin_images AS image
   WHERE image.bulletin_id = p_bulletin_id AND image.upload_id = ANY (p_upload_ids) FOR UPDATE;
  SELECT count(DISTINCT requested.upload_id) INTO v_requested_count
    FROM unnest(p_upload_ids) AS requested(upload_id);
  IF v_requested_count <> cardinality(p_upload_ids) THEN RAISE EXCEPTION 'Duplicate photo IDs were supplied.'; END IF;
  SELECT count(*) INTO v_found_count FROM public.bulletin_images AS image
   WHERE image.bulletin_id = p_bulletin_id AND image.upload_id = ANY (p_upload_ids);
  IF v_found_count <> cardinality(p_upload_ids) THEN RAISE EXCEPTION 'A photo reservation is missing.'; END IF;
  IF EXISTS (SELECT 1 FROM public.bulletin_images AS image
              WHERE image.bulletin_id = p_bulletin_id AND image.upload_id = ANY (p_upload_ids)
                AND image.deletion_pending) THEN
    RAISE EXCEPTION 'A photo is being removed and cannot be finalized.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.bulletin_images AS image
              WHERE image.bulletin_id = p_bulletin_id AND image.upload_id = ANY (p_upload_ids)
                AND NOT EXISTS (SELECT 1 FROM storage.objects AS object
                                 WHERE object.bucket_id = 'bulletin-images' AND object.name = image.image_path)) THEN
    RAISE EXCEPTION 'A photo object has not finished uploading.';
  END IF;
  UPDATE public.bulletin_images SET upload_status = 'ready'
   WHERE bulletin_id = p_bulletin_id AND upload_id = ANY (p_upload_ids) AND NOT deletion_pending;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.inspect_bulletin_image_upload(
  p_bulletin_id UUID, p_upload_id UUID, p_image_path TEXT, p_sort_order INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_result JSONB; v_lifecycle_state TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_curator() THEN
    RAISE EXCEPTION 'Curator access is required.' USING ERRCODE = '42501';
  END IF;
  SELECT bulletin.lifecycle_state INTO v_lifecycle_state
    FROM public.bulletins AS bulletin WHERE bulletin.id = p_bulletin_id FOR UPDATE;
  IF NOT FOUND OR v_lifecycle_state <> 'active' THEN RAISE EXCEPTION 'Bulletin is unavailable.'; END IF;
  SELECT jsonb_build_object(
    'image_path', image.image_path, 'sort_order', image.sort_order,
    'upload_status', image.upload_status, 'object_exists', object.name IS NOT NULL,
    'object_bulletin_id', object.metadata ->> 'bulletin_id',
    'object_upload_id', object.metadata ->> 'photo_upload_id'
  ) INTO v_result
    FROM public.bulletin_images AS image
    LEFT JOIN storage.objects AS object ON object.bucket_id = 'bulletin-images' AND object.name = image.image_path
   WHERE image.bulletin_id = p_bulletin_id AND image.upload_id = p_upload_id AND NOT image.deletion_pending
   FOR UPDATE OF image;
  IF v_result IS NULL THEN RAISE EXCEPTION 'No active database photo reservation exists for this upload.'; END IF;
  IF v_result ->> 'image_path' <> p_image_path OR (v_result ->> 'sort_order')::INTEGER <> p_sort_order THEN
    RAISE EXCEPTION 'The photo reservation does not match the requested path and order.';
  END IF;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.begin_bulletin_deletion(p_bulletin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_lifecycle_state TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_curator() THEN RAISE EXCEPTION 'Curator access is required.' USING ERRCODE = '42501'; END IF;
  SELECT bulletin.lifecycle_state INTO v_lifecycle_state FROM public.bulletins AS bulletin
   WHERE bulletin.id = p_bulletin_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bulletin not found.'; END IF;
  IF v_lifecycle_state = 'deleting' THEN RETURN TRUE; END IF;
  IF EXISTS (SELECT 1 FROM public.bulletin_images AS image
              WHERE image.bulletin_id = p_bulletin_id AND (image.upload_status = 'pending' OR image.deletion_pending)) THEN
    RETURN FALSE;
  END IF;
  UPDATE public.bulletins SET lifecycle_state = 'deleting' WHERE id = p_bulletin_id;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.begin_bulletin_image_deletion(p_bulletin_id UUID, p_image_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_lifecycle_state TEXT; v_image public.bulletin_images%ROWTYPE; v_tombstone public.bulletin_image_deletion_tombstones%ROWTYPE; v_exists BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_curator() THEN RAISE EXCEPTION 'Curator access is required.' USING ERRCODE = '42501'; END IF;
  SELECT bulletin.lifecycle_state INTO v_lifecycle_state FROM public.bulletins AS bulletin
   WHERE bulletin.id = p_bulletin_id FOR UPDATE;
  IF NOT FOUND THEN
    SELECT * INTO v_tombstone FROM public.bulletin_image_deletion_tombstones AS t
     WHERE t.bulletin_id = p_bulletin_id AND t.image_id = p_image_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Bulletin not found.'; END IF;
    SELECT EXISTS (SELECT 1 FROM storage.objects AS object WHERE object.bucket_id = 'bulletin-images' AND object.name = v_tombstone.image_path) INTO v_exists;
    IF v_exists THEN RAISE EXCEPTION 'Deleted photo object unexpectedly exists; it was left untouched.'; END IF;
    RETURN jsonb_build_object('image_path', v_tombstone.image_path, 'object_exists', FALSE, 'already_deleted', TRUE);
  END IF;
  IF v_lifecycle_state <> 'active' THEN RAISE EXCEPTION 'Bulletin is unavailable for photo removal.'; END IF;
  SELECT * INTO v_image FROM public.bulletin_images AS image
   WHERE image.bulletin_id = p_bulletin_id AND image.id = p_image_id FOR UPDATE;
  IF NOT FOUND THEN
    SELECT * INTO v_tombstone FROM public.bulletin_image_deletion_tombstones AS t
     WHERE t.bulletin_id = p_bulletin_id AND t.image_id = p_image_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Photo is not attached to this Bulletin.'; END IF;
    SELECT EXISTS (SELECT 1 FROM storage.objects AS object WHERE object.bucket_id = 'bulletin-images' AND object.name = v_tombstone.image_path) INTO v_exists;
    IF v_exists THEN RAISE EXCEPTION 'Deleted photo object unexpectedly exists; it was left untouched.'; END IF;
    RETURN jsonb_build_object('image_path', v_tombstone.image_path, 'object_exists', FALSE, 'already_deleted', TRUE);
  END IF;
  IF v_image.upload_status <> 'ready' THEN RAISE EXCEPTION 'Only finalized photos can be removed.'; END IF;
  IF v_image.image_path !~ ('^' || p_bulletin_id::text || '/[^/]+$') THEN RAISE EXCEPTION 'Unsafe photo path.'; END IF;
  IF NOT v_image.deletion_pending THEN
    UPDATE public.bulletin_images SET deletion_pending = TRUE WHERE id = p_image_id;
  END IF;
  SELECT EXISTS (SELECT 1 FROM storage.objects AS object WHERE object.bucket_id = 'bulletin-images' AND object.name = v_image.image_path) INTO v_exists;
  RETURN jsonb_build_object('image_path', v_image.image_path, 'object_exists', v_exists, 'already_deleted', FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_bulletin_image_deletion(
  p_bulletin_id UUID, p_image_id UUID, p_image_path TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_lifecycle_state TEXT; v_image public.bulletin_images%ROWTYPE; v_tombstone public.bulletin_image_deletion_tombstones%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_curator() THEN RAISE EXCEPTION 'Curator access is required.' USING ERRCODE = '42501'; END IF;
  SELECT bulletin.lifecycle_state INTO v_lifecycle_state FROM public.bulletins AS bulletin
   WHERE bulletin.id = p_bulletin_id FOR UPDATE;
  IF NOT FOUND THEN
    SELECT * INTO v_tombstone FROM public.bulletin_image_deletion_tombstones AS t
     WHERE t.bulletin_id = p_bulletin_id AND t.image_id = p_image_id;
    IF NOT FOUND OR v_tombstone.image_path <> p_image_path THEN RETURN FALSE; END IF;
    IF EXISTS (SELECT 1 FROM storage.objects AS object WHERE object.bucket_id = 'bulletin-images' AND object.name = p_image_path) THEN
      RAISE EXCEPTION 'Storage object still exists; the photo attachment was retained.';
    END IF;
    RETURN TRUE;
  END IF;
  IF v_lifecycle_state <> 'active' THEN RAISE EXCEPTION 'Bulletin is unavailable for photo removal.'; END IF;
  SELECT * INTO v_image FROM public.bulletin_images AS image
   WHERE image.bulletin_id = p_bulletin_id AND image.id = p_image_id FOR UPDATE;
  IF NOT FOUND THEN
    SELECT * INTO v_tombstone FROM public.bulletin_image_deletion_tombstones AS t
     WHERE t.bulletin_id = p_bulletin_id AND t.image_id = p_image_id;
    IF NOT FOUND OR v_tombstone.image_path <> p_image_path THEN RETURN FALSE; END IF;
    IF EXISTS (SELECT 1 FROM storage.objects AS object WHERE object.bucket_id = 'bulletin-images' AND object.name = p_image_path) THEN
      RAISE EXCEPTION 'Storage object still exists; the photo attachment was retained.';
    END IF;
    RETURN TRUE;
  END IF;
  IF v_image.image_path <> p_image_path OR NOT v_image.deletion_pending THEN RAISE EXCEPTION 'Photo deletion reservation does not match.'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects AS object WHERE object.bucket_id = 'bulletin-images' AND object.name = p_image_path) THEN
    RAISE EXCEPTION 'Storage object still exists; the photo attachment was retained.';
  END IF;
  INSERT INTO public.bulletin_image_deletion_tombstones (bulletin_id, image_id, upload_id, image_path)
  VALUES (p_bulletin_id, v_image.id, v_image.upload_id, v_image.image_path);
  DELETE FROM public.bulletin_images WHERE id = p_image_id AND bulletin_id = p_bulletin_id AND deletion_pending;
  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.begin_bulletin_image_deletion(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finish_bulletin_image_deletion(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.begin_bulletin_image_deletion(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_bulletin_image_deletion(UUID, UUID, TEXT) TO authenticated;
