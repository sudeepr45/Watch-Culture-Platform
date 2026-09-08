-- ==============================================================================
-- PHASE 3C: PERSONAL WATCH FIELDS FOR STORIES
-- Migration: 20260908_add_personal_watch_fields.sql
-- Description: Adds personal watch fields (brand, model, reference) to public.stories
--              and makes watch_id nullable so community stories belong to the user's
--              own physical watch rather than requiring central archive entries.
-- ==============================================================================

-- 1. Make watch_id nullable for compatibility with existing schema
ALTER TABLE public.stories
  ALTER COLUMN watch_id DROP NOT NULL;

-- 2. Add personal watch columns
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS personal_watch_brand TEXT,
  ADD COLUMN IF NOT EXISTS personal_watch_model TEXT,
  ADD COLUMN IF NOT EXISTS personal_watch_reference TEXT;

-- 3. Backfill brand, model, and reference ONLY from valid public.watches rows (if any existing stories exist)
DO $$
DECLARE
  unmapped_count INTEGER;
BEGIN
  -- Backfill from public.watches strictly where watch_id matches a real watch in public.watches
  UPDATE public.stories s
  SET
    personal_watch_brand = w.brand,
    personal_watch_model = w.model,
    personal_watch_reference = w.reference_number
  FROM public.watches w
  WHERE s.watch_id = w.id
    AND (s.personal_watch_brand IS NULL OR s.personal_watch_model IS NULL);

  -- Check if any existing stories have unpopulated brand or model
  SELECT COUNT(*) INTO unmapped_count
  FROM public.stories
  WHERE personal_watch_brand IS NULL OR personal_watch_model IS NULL;

  -- If any records cannot be safely mapped to a genuine watch, stop and report rather than fabricating fake data
  IF unmapped_count > 0 THEN
    RAISE EXCEPTION 'Cannot enforce NOT NULL on personal_watch_brand/personal_watch_model: % existing story record(s) cannot be mapped to a real watch in public.watches. Watch Culture never fabricates watch identity.', unmapped_count;
  END IF;
END $$;

-- 4. Enforce NOT NULL on brand and model (stories are about real personal watches)
ALTER TABLE public.stories
  ALTER COLUMN personal_watch_brand SET NOT NULL,
  ALTER COLUMN personal_watch_model SET NOT NULL;

-- 5. Content integrity: Brand and Model cannot be whitespace-only strings
ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_personal_watch_brand_not_empty;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_personal_watch_brand_not_empty
  CHECK (length(trim(personal_watch_brand)) > 0);

ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_personal_watch_model_not_empty;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_personal_watch_model_not_empty
  CHECK (length(trim(personal_watch_model)) > 0);

-- 6. Performance index for querying stories by personal watch brand and model
CREATE INDEX IF NOT EXISTS idx_stories_personal_watch
  ON public.stories (personal_watch_brand, personal_watch_model);
