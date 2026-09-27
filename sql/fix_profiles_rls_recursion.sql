-- Stop "infinite recursion detected in policy for relation profiles".
-- The admin policy was selecting from profiles while protecting profiles.
-- Run this once in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO service_role;

DROP POLICY IF EXISTS "Admins can do anything with profiles" ON public.profiles;

CREATE POLICY "Admins can do anything with profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.current_profile_role() = 'admin')
  WITH CHECK (public.current_profile_role() = 'admin');
