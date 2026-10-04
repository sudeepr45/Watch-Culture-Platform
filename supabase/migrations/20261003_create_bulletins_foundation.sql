-- ==============================================================================
-- MOERI & JEANNERET — THE BULLETIN FOUNDATION
-- Migration: 20261003_create_bulletins_foundation.sql
-- Description: Creates the curator-managed Bulletin publication table.
-- ===============================================================================

CREATE TABLE public.bulletins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulletin_number INTEGER GENERATED ALWAYS AS IDENTITY UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL,
  cover_image TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  related_watch_id UUID REFERENCES public.watches(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT bulletins_category_check
    CHECK (category IN ('Market', 'Auction', 'Release', 'History', 'Note'))
);

CREATE OR REPLACE FUNCTION public.handle_bulletin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_bulletin_updated
  BEFORE UPDATE ON public.bulletins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_bulletin_updated_at();

CREATE INDEX idx_bulletins_published_at
  ON public.bulletins (published_at DESC);

ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for published bulletins"
  ON public.bulletins
  FOR SELECT
  USING (published_at IS NOT NULL);

CREATE POLICY "Allow curators to insert bulletins"
  ON public.bulletins
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_curator());

CREATE POLICY "Allow curators to update bulletins"
  ON public.bulletins
  FOR UPDATE
  TO authenticated
  USING (public.is_curator())
  WITH CHECK (public.is_curator());

CREATE POLICY "Allow curators to delete bulletins"
  ON public.bulletins
  FOR DELETE
  TO authenticated
  USING (public.is_curator());
