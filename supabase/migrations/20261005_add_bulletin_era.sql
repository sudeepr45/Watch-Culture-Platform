-- Add editorial era classification to Bulletins.
-- Existing rows receive the default era, Modern.

ALTER TABLE public.bulletins
  ADD COLUMN era TEXT NOT NULL DEFAULT 'Modern',
  ADD CONSTRAINT bulletins_era_check
    CHECK (era IN ('Modern', 'Vintage'));
