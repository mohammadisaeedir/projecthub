-- People who sign up can see projects, but task assignment uses the members table.
-- Add every existing account to the team, and do the same for future signups.

INSERT INTO public.members (user_id, name, email, role)
SELECT
  p.id,
  COALESCE(NULLIF(p.full_name, ''), split_part(COALESCE(p.email, ''), '@', 1), 'Member'),
  p.email,
  'developer'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.members m WHERE m.user_id = p.id
)
AND NOT EXISTS (
  SELECT 1
  FROM public.members m
  WHERE p.email IS NOT NULL
    AND lower(m.email) = lower(p.email)
);

UPDATE public.members m
SET user_id = p.id
FROM public.profiles p
WHERE m.user_id IS NULL
  AND p.email IS NOT NULL
  AND lower(m.email) = lower(p.email);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'viewer'
  );

  INSERT INTO public.members (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(COALESCE(NEW.email, ''), '@', 1), 'Member'),
    NEW.email,
    'developer'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
