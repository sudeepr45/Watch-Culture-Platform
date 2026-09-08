-- ==============================================================================
-- PHASE 3A: ADD STORY SLUG MIGRATION
-- Migration: 20260908_add_story_slug.sql
-- Description: Adds unique slug column and integrity constraint to public.stories
-- ==============================================================================

-- 1. Add slug column to public.stories (table is currently empty)
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL;

-- 2. Ensure slug is unique across all stories
ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_slug_unique;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_slug_unique UNIQUE (slug);

-- 3. Integrity constraint preventing blank or whitespace-only slugs
ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_slug_not_empty;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_slug_not_empty CHECK (length(trim(slug)) > 0);

-- 4. Performance index for fast lookup by slug on the /stories/:slug route
CREATE INDEX IF NOT EXISTS idx_stories_slug ON public.stories (slug);
