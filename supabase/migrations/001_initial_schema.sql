-- ============================================================
-- DocVault — Complete Supabase Database Setup (Fixed order)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  display_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'moderator', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DOCUMENTS TABLE (no policies yet — doc_access doesn't exist yet)
CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  file_path     TEXT NOT NULL,
  file_size     BIGINT,
  mime_type     TEXT,
  uploaded_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  is_public     BOOLEAN NOT NULL DEFAULT false,
  moderated_by  UUID REFERENCES public.profiles(id),
  moderated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DOC_ACCESS TABLE (must exist before policies that reference it)
CREATE TABLE IF NOT EXISTS public.doc_access (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_by    UUID REFERENCES public.profiles(id),
  granted_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (document_id, user_id)
);

-- 4. MOD_REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.mod_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES public.profiles(id),
  decision      TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mod_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- DOCUMENTS POLICIES (doc_access table now exists)
-- ============================================================

-- Owner always sees their own docs
CREATE POLICY "Owners see their documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Approved public docs visible to everyone including anonymous
CREATE POLICY "Public approved docs visible to all"
  ON public.documents FOR SELECT
  USING (status = 'approved' AND is_public = true);

-- Approved private docs visible to users with granted access
CREATE POLICY "Private docs visible to granted users"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    AND is_public = false
    AND EXISTS (
      SELECT 1 FROM public.doc_access da
      WHERE da.document_id = documents.id
        AND da.user_id = auth.uid()
    )
  );

-- Moderators and admins see all docs
CREATE POLICY "Moderators see all documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  );

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Owners can update their own doc (e.g. toggle is_public)
CREATE POLICY "Owners can update own documents"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Moderators can update status
CREATE POLICY "Moderators can update document status"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  );

-- Owners can delete their own docs
CREATE POLICY "Owners can delete own documents"
  ON public.documents FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- ============================================================
-- DOC_ACCESS POLICIES
-- ============================================================
CREATE POLICY "Users see their own access grants"
  ON public.doc_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins see all access grants"
  ON public.doc_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins and doc owners can grant access"
  ON public.doc_access FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND d.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Admins can revoke access"
  ON public.doc_access FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- MOD_REVIEWS POLICIES
-- ============================================================
CREATE POLICY "Moderators see all reviews"
  ON public.mod_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "Moderators can insert reviews"
  ON public.mod_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on documents
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_documents_updated ON public.documents;
CREATE TRIGGER on_documents_updated
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by  ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status        ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_is_public     ON public.documents(is_public);
CREATE INDEX IF NOT EXISTS idx_doc_access_user_id      ON public.doc_access(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_access_document_id  ON public.doc_access(document_id);
CREATE INDEX IF NOT EXISTS idx_mod_reviews_document_id ON public.mod_reviews(document_id);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users read own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Moderators read all files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "Users delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- DONE. All tables, policies, triggers, and storage configured.
-- ============================================================
