-- The app saves a project color and icon. Add the columns the create form expects.
-- Run this once in the Supabase SQL Editor.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#8B5CF6',
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'FolderKanban';

NOTIFY pgrst, 'reload schema';
