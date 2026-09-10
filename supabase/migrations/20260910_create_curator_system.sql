-- ==============================================================================
-- MOERI & JEANNERET — CURATOR ARCHIVE SYSTEM
-- Migration: 20260910_create_curator_system
--
-- SCOPE:
--   1. Add lifecycle status column to public.watches
--   2. Mark all existing watches as published
--   3. Add image provenance metadata columns to public.watches
--   4. Create public.curators table (no client-facing RLS policies)
--   5. Create public.is_curator() security-definer function
--   6. Replace watch SELECT RLS policy (published + curator)
--   7. Add watch INSERT RLS policy (curator only)
--   8. Add watch UPDATE RLS policy (curator only)
--   9. Confirm no DELETE policy is created
--
-- SAFETY:
--   - All ALTER TABLE changes are additive only (no column removal, no type change)
--   - All existing watch rows are explicitly set to 'published' before the CHECK
--     constraint is enforced (status DEFAULT 'draft' applies to new rows only)
--   - Existing watch IDs, slugs, specs, images are not touched
--   - Function is SECURITY DEFINER with fixed search_path
--   - No service_role credentials required or used
-- ==============================================================================

-- -----------------------------------------------------------------------
-- STEP 1: Add lifecycle status column to public.watches
-- -----------------------------------------------------------------------

-- Add the column as nullable first so existing rows don't violate NOT NULL
ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS status TEXT;

-- Explicitly mark ALL existing watches as 'published' before adding constraints
UPDATE public.watches
  SET status = 'published'
  WHERE status IS NULL;

-- Now enforce NOT NULL + CHECK constraint
ALTER TABLE public.watches
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'draft';

-- Add CHECK constraint (idempotent guard: drop then recreate)
ALTER TABLE public.watches
  DROP CONSTRAINT IF EXISTS watches_status_check;

ALTER TABLE public.watches
  ADD CONSTRAINT watches_status_check
  CHECK (status IN ('draft', 'published', 'archived'));

-- Index for efficient status filtering in RLS and curator queries
CREATE INDEX IF NOT EXISTS idx_watches_status ON public.watches (status);

-- -----------------------------------------------------------------------
-- STEP 2: Add image provenance metadata columns
-- (All nullable — existing watches are unaffected)
-- -----------------------------------------------------------------------

ALTER TABLE public.watches
  ADD COLUMN IF NOT EXISTS image_source_name      TEXT,
  ADD COLUMN IF NOT EXISTS image_source_url       TEXT,
  ADD COLUMN IF NOT EXISTS image_verification_status TEXT
    DEFAULT 'pending'
    CHECK (image_verification_status IN ('pending', 'verified')),
  ADD COLUMN IF NOT EXISTS image_verified_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS image_usage_note       TEXT;

-- -----------------------------------------------------------------------
-- STEP 3: Create public.curators table
--
-- SECURITY: No client-facing RLS policies.
-- Curator membership is controlled exclusively through trusted
-- database administration (Supabase Dashboard SQL editor or
-- a service-role operation). No anon or authenticated user
-- can SELECT, INSERT, UPDATE, or DELETE curators through the API.
-- -----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.curators (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'curator'
               CHECK (role IN ('curator', 'owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS — with no policies, the table is completely inaccessible
-- to anon and authenticated roles via the Supabase API.
ALTER TABLE public.curators ENABLE ROW LEVEL SECURITY;

-- Explicitly ensure no stale open policies exist
DROP POLICY IF EXISTS "Allow curator read" ON public.curators;
DROP POLICY IF EXISTS "Allow public read access for curators" ON public.curators;
DROP POLICY IF EXISTS "Allow curators to read their own record" ON public.curators;

-- -----------------------------------------------------------------------
-- STEP 4: Create public.is_curator() function
--
-- SECURITY DEFINER: Runs with definer's privileges so it can query
--   public.curators even though authenticated users have no direct
--   access to that table.
-- SET search_path = '': Prevents search_path injection attacks.
-- STABLE: Safe for RLS policy use; result is consistent within a query.
-- REVOKE from PUBLIC: Only the authenticated role may call this.
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_curator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.curators
    WHERE user_id = auth.uid()
  );
$$;

-- Restrict execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.is_curator() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_curator() TO authenticated;

-- -----------------------------------------------------------------------
-- STEP 5: Replace watch SELECT RLS policy
--
-- Public/unauthenticated: only published watches
-- Authenticated curators: all statuses (draft, published, archived)
-- Authenticated non-curators: only published watches
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow public read access for watches" ON public.watches;
DROP POLICY IF EXISTS "Watches: public read published" ON public.watches;
DROP POLICY IF EXISTS "Watches: curator read all" ON public.watches;

-- Unified policy: published OR curator
CREATE POLICY "Watches: select published or curator"
  ON public.watches
  FOR SELECT
  USING (
    status = 'published'
    OR (
      auth.uid() IS NOT NULL
      AND public.is_curator()
    )
  );

-- -----------------------------------------------------------------------
-- STEP 6: Watch INSERT policy — curator only
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Watches: curator insert" ON public.watches;

CREATE POLICY "Watches: curator insert"
  ON public.watches
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_curator());

-- -----------------------------------------------------------------------
-- STEP 7: Watch UPDATE policy — curator only
-- -----------------------------------------------------------------------

DROP POLICY IF EXISTS "Watches: curator update" ON public.watches;

CREATE POLICY "Watches: curator update"
  ON public.watches
  FOR UPDATE
  TO authenticated
  USING (public.is_curator())
  WITH CHECK (public.is_curator());

-- -----------------------------------------------------------------------
-- STEP 8: NO DELETE policy
--
-- Hard deletion of archive watches is disabled by design.
-- The lifecycle is: draft → published → archived
-- Archived watches remain in the database but are hidden from public.
-- -----------------------------------------------------------------------
-- (intentionally no DELETE policy created)

-- -----------------------------------------------------------------------
-- OWNER BOOTSTRAP: Intentionally pending
--
-- Per the master implementation spec, the owner's auth.users UUID cannot
-- be determined without direct inspection of the live auth.users table
-- via the Supabase Dashboard SQL editor.
--
-- To bootstrap the owner after this migration runs:
--
--   INSERT INTO public.curators (user_id, role)
--   VALUES ('<YOUR_AUTH_USER_UUID>', 'owner');
--
-- Run this in the Supabase Dashboard → SQL Editor using the actual UUID
-- visible in Authentication → Users.
-- -----------------------------------------------------------------------
