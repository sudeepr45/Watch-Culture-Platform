-- ==============================================================================
-- PHASE 2F: MY COLLECTION / MY WRIST MIGRATION
-- Run this script in the Supabase SQL Editor to provision public.user_watches
-- ==============================================================================

-- 1. Create user_watches table linking auth.users and public.watches
CREATE TABLE IF NOT EXISTS public.user_watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_watch UNIQUE (user_id, watch_id)
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_watches_user_id ON public.user_watches (user_id);
CREATE INDEX IF NOT EXISTS idx_user_watches_watch_id ON public.user_watches (watch_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_watches ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- SELECT: Authenticated users can only read their own collection in v1
DROP POLICY IF EXISTS "Allow users to read own collection" ON public.user_watches;
CREATE POLICY "Allow users to read own collection"
  ON public.user_watches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Authenticated users can only insert watches into their own collection
DROP POLICY IF EXISTS "Allow users to insert into own collection" ON public.user_watches;
CREATE POLICY "Allow users to insert into own collection"
  ON public.user_watches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Authenticated users can only remove watches from their own collection
DROP POLICY IF EXISTS "Allow users to delete from own collection" ON public.user_watches;
CREATE POLICY "Allow users to delete from own collection"
  ON public.user_watches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
