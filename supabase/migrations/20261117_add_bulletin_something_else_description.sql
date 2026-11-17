-- Store optional explanatory copy for the "Something Else" Bulletin category.
-- Existing rows retain all values; the nullable column starts empty.

ALTER TABLE public.bulletins
  ADD COLUMN something_else_description TEXT;

ALTER TABLE public.bulletins
  ADD CONSTRAINT bulletins_something_else_description_check
    CHECK (
      (
        categories @> ARRAY['Something Else']::TEXT[]
        AND something_else_description IS NOT NULL
        AND btrim(something_else_description) <> ''
      )
      OR (
        NOT (categories @> ARRAY['Something Else']::TEXT[])
        AND something_else_description IS NULL
      )
    ) NOT VALID;

-- Preserve the existing curator RLS boundary while granting access to the new
-- column using the same column-level write model as the category array.
GRANT SELECT (something_else_description) ON public.bulletins TO anon, authenticated;
GRANT INSERT (something_else_description) ON public.bulletins TO authenticated;
GRANT UPDATE (something_else_description) ON public.bulletins TO authenticated;
