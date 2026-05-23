-- ============================================================
-- DocVault Migration 002 — Preferences, Bookmarks, Categories
-- Run this in Supabase SQL Editor AFTER migration 001
-- ============================================================

-- 1. Add category column to documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS category TEXT
  CHECK (category IN (
    'House', 'Apartments', 'Design', 'Construction',
    'Building Materials', 'Renovation', 'Vastu', 'General'
  ));

-- 2. USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  categories          TEXT[] DEFAULT '{}',
  use_default         BOOLEAN NOT NULL DEFAULT true,
  notify_approval     BOOLEAN NOT NULL DEFAULT true,
  notify_shared       BOOLEAN NOT NULL DEFAULT true,
  notify_newsletter   BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON public.user_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-create preferences row on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_preferences();

-- 3. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id   UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, document_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bookmarks"
  ON public.bookmarks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Updated_at trigger for preferences
DROP TRIGGER IF EXISTS on_preferences_updated ON public.user_preferences;
CREATE TRIGGER on_preferences_updated
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_documents_category   ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id    ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_document_id ON public.bookmarks(document_id);
CREATE INDEX IF NOT EXISTS idx_user_prefs_user_id   ON public.user_preferences(user_id);

-- 6. Add avatar_url and bio to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio        TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================
-- DONE. Run this once after migration 001.
-- ============================================================
