CREATE POLICY "Allow curators to read bulletins"
  ON public.bulletins
  FOR SELECT
  TO authenticated
  USING (
    published_at IS NOT NULL
    OR public.is_curator()
  );
