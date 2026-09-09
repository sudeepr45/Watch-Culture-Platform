-- ==============================================================================
-- PHASE 3D: COMMUNITY INTERACTION (LIKES, BOOKMARKS, COMMENTS, COUNTERS)
-- Migration: 20260909_create_story_interactions.sql
-- Description: Creates story_likes, story_bookmarks, story_comments tables,
--              adds real-time atomic counter columns and triggers to public.stories,
--              enforces strict RLS, draft protections, and least-privilege grants.
-- ==============================================================================

-- ==============================================================================
-- 1. STORY COUNTER COLUMNS ON public.stories
-- ==============================================================================

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;

-- Enforce non-negative counters
ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_likes_count_non_negative;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_likes_count_non_negative CHECK (likes_count >= 0);

ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_comments_count_non_negative;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_comments_count_non_negative CHECK (comments_count >= 0);

-- ==============================================================================
-- 2. STORY LIKES TABLE & POLICIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_story_like UNIQUE (story_id, user_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON public.story_likes (story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON public.story_likes (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- SELECT: Public read access for likes on published stories only (never drafts)
DROP POLICY IF EXISTS "Allow public read access for likes on published stories" ON public.story_likes;
CREATE POLICY "Allow public read access for likes on published stories"
  ON public.story_likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stories
      WHERE public.stories.id = story_likes.story_id
        AND public.stories.status = 'published'
    )
  );

-- INSERT: Authenticated users may like only as themselves and only published stories
DROP POLICY IF EXISTS "Allow authenticated users to like published stories" ON public.story_likes;
CREATE POLICY "Allow authenticated users to like published stories"
  ON public.story_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.stories
      WHERE public.stories.id = story_likes.story_id
        AND public.stories.status = 'published'
    )
  );

-- DELETE: Authenticated users may delete only their own like
DROP POLICY IF EXISTS "Allow users to delete own like" ON public.story_likes;
CREATE POLICY "Allow users to delete own like"
  ON public.story_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 3. STORY BOOKMARKS TABLE & POLICIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.story_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_story_bookmark UNIQUE (story_id, user_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_story_bookmarks_story_id ON public.story_bookmarks (story_id);
CREATE INDEX IF NOT EXISTS idx_story_bookmarks_user_id ON public.story_bookmarks (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.story_bookmarks ENABLE ROW LEVEL SECURITY;

-- SELECT: Bookmarks are strictly private to the authenticated owner
DROP POLICY IF EXISTS "Allow users to read own bookmarks" ON public.story_bookmarks;
CREATE POLICY "Allow users to read own bookmarks"
  ON public.story_bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Authenticated users may bookmark only as themselves and only published stories
DROP POLICY IF EXISTS "Allow authenticated users to bookmark published stories" ON public.story_bookmarks;
CREATE POLICY "Allow authenticated users to bookmark published stories"
  ON public.story_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.stories
      WHERE public.stories.id = story_bookmarks.story_id
        AND public.stories.status = 'published'
    )
  );

-- DELETE: Authenticated users may delete only their own bookmark
DROP POLICY IF EXISTS "Allow users to delete own bookmark" ON public.story_bookmarks;
CREATE POLICY "Allow users to delete own bookmark"
  ON public.story_bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. STORY COMMENTS TABLE & POLICIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT story_comments_text_not_empty CHECK (length(trim(comment_text)) > 0),
  CONSTRAINT story_comments_text_length CHECK (length(comment_text) <= 1000)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON public.story_comments (story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON public.story_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id_created_at ON public.story_comments (story_id, created_at ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: Public read access for comments on published stories only
DROP POLICY IF EXISTS "Allow public read access for comments on published stories" ON public.story_comments;
CREATE POLICY "Allow public read access for comments on published stories"
  ON public.story_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stories
      WHERE public.stories.id = story_comments.story_id
        AND public.stories.status = 'published'
    )
  );

-- INSERT: Authenticated users may comment only as themselves on published stories
DROP POLICY IF EXISTS "Allow authenticated users to comment on published stories" ON public.story_comments;
CREATE POLICY "Allow authenticated users to comment on published stories"
  ON public.story_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.stories
      WHERE public.stories.id = story_comments.story_id
        AND public.stories.status = 'published'
    )
  );

-- UPDATE: Authenticated users may update only their own comments on published stories
DROP POLICY IF EXISTS "Allow users to update own comments" ON public.story_comments;
CREATE POLICY "Allow users to update own comments"
  ON public.story_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.stories
      WHERE public.stories.id = story_comments.story_id
        AND public.stories.status = 'published'
    )
  );

-- DELETE: Authenticated users may delete only their own comments
DROP POLICY IF EXISTS "Allow users to delete own comments" ON public.story_comments;
CREATE POLICY "Allow users to delete own comments"
  ON public.story_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. ATOMIC COUNTER TRIGGERS FOR LIKES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_story_like_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories
    SET likes_count = likes_count + 1
    WHERE id = NEW.story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stories
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_story_like_change ON public.story_likes;
CREATE TRIGGER on_story_like_change
  AFTER INSERT OR DELETE ON public.story_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_story_like_counter();

-- ==============================================================================
-- 6. ATOMIC COUNTER TRIGGERS FOR COMMENTS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_story_comment_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories
    SET comments_count = comments_count + 1
    WHERE id = NEW.story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stories
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_story_comment_change ON public.story_comments;
CREATE TRIGGER on_story_comment_change
  AFTER INSERT OR DELETE ON public.story_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_story_comment_counter();

-- ==============================================================================
-- 7. UPDATED_AT TRIGGER FOR COMMENTS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_story_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_story_comment_updated ON public.story_comments;
CREATE TRIGGER on_story_comment_updated
  BEFORE UPDATE OF comment_text ON public.story_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_story_comment_updated_at();

-- ==============================================================================
-- 8. EXISTING DATA SAFETY / REAL COUNT BACKFILL
-- ==============================================================================

-- Safely sync counters from actual table counts (never fabricates fake numbers)
UPDATE public.stories s
SET
  likes_count = (
    SELECT COUNT(*) FROM public.story_likes l WHERE l.story_id = s.id
  ),
  comments_count = (
    SELECT COUNT(*) FROM public.story_comments c WHERE c.story_id = s.id
  );

-- ==============================================================================
-- 9. LEAST-PRIVILEGE API GRANTS
-- ==============================================================================

-- Likes: Anonymous and authenticated can read; only authenticated can insert/delete
GRANT SELECT ON public.story_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.story_likes TO authenticated;

-- Bookmarks: Strictly private to authenticated collectors
GRANT SELECT, INSERT, DELETE ON public.story_bookmarks TO authenticated;

-- Comments: Anonymous and authenticated can read; authenticated can insert, update, delete
GRANT SELECT ON public.story_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.story_comments TO authenticated;
