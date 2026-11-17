-- Add multi-category Bulletin support while retaining the legacy scalar field.
-- Existing assignments are copied as one-element arrays without changing them.

ALTER TABLE public.bulletins
  ADD COLUMN categories TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- The existing on_bulletin_updated trigger changes updated_at on every UPDATE.
-- Disable only that trigger for this backfill, and always restore it before
-- leaving the block. The DO statement is atomic, so an error also rolls back
-- the temporary trigger state and the data update together.
DO $bulletin_category_backfill$
BEGIN
  EXECUTE 'ALTER TABLE public.bulletins DISABLE TRIGGER on_bulletin_updated';

  BEGIN
    UPDATE public.bulletins
       SET categories = ARRAY[category];
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'ALTER TABLE public.bulletins ENABLE TRIGGER on_bulletin_updated';
    RAISE;
  END;

  EXECUTE 'ALTER TABLE public.bulletins ENABLE TRIGGER on_bulletin_updated';
END;
$bulletin_category_backfill$;

ALTER TABLE public.bulletins
  DROP CONSTRAINT IF EXISTS bulletins_category_check;

CREATE OR REPLACE FUNCTION public.sync_bulletin_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_categories TEXT[];
BEGIN
  -- Keep older clients that write only category compatible with this column.
  IF TG_OP = 'UPDATE'
     AND NEW.category IS DISTINCT FROM OLD.category
     AND NEW.categories IS NOT DISTINCT FROM OLD.categories THEN
    NEW.categories := ARRAY[NEW.category];
  END IF;

  IF COALESCE(cardinality(NEW.categories), 0) = 0 THEN
    NEW.categories := ARRAY[NEW.category];
  END IF;

  -- Preserve curator selection order while removing duplicate values.
  SELECT array_agg(items.category ORDER BY items.first_position)
    INTO v_categories
    FROM (
      SELECT value AS category, min(position) AS first_position
        FROM unnest(NEW.categories) WITH ORDINALITY AS selected(value, position)
       WHERE btrim(value) <> ''
       GROUP BY value
    ) AS items;

  IF COALESCE(cardinality(v_categories), 0) = 0 THEN
    RAISE EXCEPTION 'At least one Bulletin category is required.';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM unnest(v_categories) AS selected(value)
     WHERE selected.value NOT IN (
       'Note', 'Something Else', 'Dispatches',
       'Market', 'Auction', 'Release', 'History'
     )
  ) THEN
    RAISE EXCEPTION 'One or more Bulletin categories are not supported.';
  END IF;

  NEW.categories := v_categories;
  NEW.category := v_categories[1];
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bulletins_sync_categories ON public.bulletins;
CREATE TRIGGER bulletins_sync_categories
  BEFORE INSERT OR UPDATE ON public.bulletins
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_bulletin_categories();

ALTER TABLE public.bulletins
  ADD CONSTRAINT bulletins_categories_check
    CHECK (
      cardinality(categories) > 0
      AND categories <@ ARRAY[
        'Note', 'Something Else', 'Dispatches',
        'Market', 'Auction', 'Release', 'History'
      ]::TEXT[]
      AND category = categories[1]
    );

-- The lifecycle migration uses column-level Bulletin write grants.
GRANT INSERT (categories) ON public.bulletins TO authenticated;
GRANT UPDATE (categories) ON public.bulletins TO authenticated;
