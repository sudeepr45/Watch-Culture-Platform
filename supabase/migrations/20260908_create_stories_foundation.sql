-- ==============================================================================
-- PHASE 3A: COMMUNITY STORIES FOUNDATION MIGRATION
-- Migration: 20260908_create_stories_foundation.sql
-- Description: Establishes public.stories table, constraints, indexes, and RLS policies
-- ==============================================================================

-- 1. Create public.stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE RESTRICT,
  photo_url TEXT,
  title TEXT NOT NULL,
  story_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Status integrity: status must be either 'draft' or 'published'
  CONSTRAINT stories_status_check CHECK (status IN ('draft', 'published')),

  -- Content integrity: title and story_text cannot be empty whitespace strings
  CONSTRAINT stories_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT stories_story_text_not_empty CHECK (length(trim(story_text)) > 0),

  -- Publication integrity: published stories must have published_at and a non-blank photo_url
  CONSTRAINT stories_publication_integrity_check CHECK (
    (status = 'draft') OR (
      status = 'published'
      AND published_at IS NOT NULL
      AND photo_url IS NOT NULL
      AND length(trim(photo_url)) > 0
    )
  )
);

-- 2. Performance Indexes
-- Index for querying stories by owner (e.g. collector profile, author dashboard)
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories (user_id);

-- Index for querying community stories by watch (e.g. watch detail page references)
CREATE INDEX IF NOT EXISTS idx_stories_watch_id ON public.stories (watch_id);

-- Composite index for the main public community feed (published stories, newest first)
CREATE INDEX IF NOT EXISTS idx_stories_status_published_at ON public.stories (status, published_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- SELECT (Public): Allow any user (authenticated or anonymous) to view published stories
DROP POLICY IF EXISTS "Allow public read access for published stories" ON public.stories;
CREATE POLICY "Allow public read access for published stories"
  ON public.stories
  FOR SELECT
  USING (status = 'published');

-- SELECT (Author): Allow authenticated users to view their own stories (both drafts and published)
DROP POLICY IF EXISTS "Allow authors to read own stories" ON public.stories;
CREATE POLICY "Allow authors to read own stories"
  ON public.stories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Allow authenticated users to create stories owned by themselves
DROP POLICY IF EXISTS "Allow authors to insert own stories" ON public.stories;
CREATE POLICY "Allow authors to insert own stories"
  ON public.stories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Allow authenticated users to update only their own stories
DROP POLICY IF EXISTS "Allow authors to update own stories" ON public.stories;
CREATE POLICY "Allow authors to update own stories"
  ON public.stories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Allow authenticated users to delete only their own stories
DROP POLICY IF EXISTS "Allow authors to delete own stories" ON public.stories;
CREATE POLICY "Allow authors to delete own stories"
  ON public.stories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
