-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration SQL Initiale
-- Base de données PostgreSQL (Supabase)
-- ═══════════════════════════════════════════════════════════════

-- Extension pour updated_at automatique
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ═══════════════════════════════════════════════════════
-- TABLE: profiles
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  class_level TEXT CHECK (class_level IN ('seconde', 'premiere', 'terminale')),
  school_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ═══════════════════════════════════════════════════════
-- TABLE: subjects
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  coefficient NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  teacher_name TEXT,
  color TEXT DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_subjects_user_id ON public.subjects(user_id);

-- ═══════════════════════════════════════════════════════
-- TABLE: grades
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  value NUMERIC(5,2) NOT NULL CHECK (value >= 0 AND value <= 20),
  out_of NUMERIC(5,2) NOT NULL DEFAULT 20 CHECK (out_of > 0),
  coefficient NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  label TEXT,
  trimester SMALLINT NOT NULL CHECK (trimester IN (1, 2, 3)),
  date DATE,
  is_simulated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_grades_user_subject ON public.grades(user_id, subject_id);
CREATE INDEX idx_grades_trimester ON public.grades(user_id, trimester);

-- ═══════════════════════════════════════════════════════
-- TABLE: folders
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_folders_user_id ON public.folders(user_id);
CREATE INDEX idx_folders_parent ON public.folders(user_id, parent_id);

-- ═══════════════════════════════════════════════════════
-- TABLE: revision_sheets
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.revision_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  original_text TEXT,
  original_image_url TEXT,
  content TEXT NOT NULL,
  key_concepts JSONB DEFAULT '[]',
  summary TEXT,
  source_type TEXT CHECK (source_type IN ('text', 'photo', 'manual')) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_sheets_user_id ON public.revision_sheets(user_id);
CREATE INDEX idx_sheets_folder ON public.revision_sheets(user_id, folder_id);
CREATE INDEX idx_sheets_subject ON public.revision_sheets(subject_id);

CREATE TRIGGER handle_sheets_updated_at
  BEFORE UPDATE ON public.revision_sheets
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ═══════════════════════════════════════════════════════
-- TABLE: schedules
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  timetable_image_url TEXT,
  constraints JSONB DEFAULT '{}',
  homework JSONB DEFAULT '[]',
  generated_plan JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_schedules_user_week ON public.schedules(user_id, week_start);

-- ═══════════════════════════════════════════════════════
-- TABLE: generated_messages
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.generated_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('absence', 'retard', 'question', 'rdv', 'rattrapage', 'autre')),
  context TEXT NOT NULL,
  teacher_name TEXT,
  generated_content TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_user_id ON public.generated_messages(user_id);

-- ═══════════════════════════════════════════════════════
-- TABLE: ai_usage
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_ai_usage_user_date ON public.ai_usage(user_id, created_at);

-- ═══════════════════════════════════════════════════════
-- TRIGGER: Auto-create profile on auth.users insert
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════

-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── SUBJECTS ──
CREATE POLICY "Users can view own subjects"
  ON public.subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON public.subjects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON public.subjects FOR DELETE
  USING (auth.uid() = user_id);

-- ── GRADES ──
CREATE POLICY "Users can view own grades"
  ON public.grades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grades"
  ON public.grades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grades"
  ON public.grades FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own grades"
  ON public.grades FOR DELETE
  USING (auth.uid() = user_id);

-- ── FOLDERS ──
CREATE POLICY "Users can view own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
  ON public.folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON public.folders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON public.folders FOR DELETE
  USING (auth.uid() = user_id);

-- ── REVISION SHEETS ──
CREATE POLICY "Users can view own sheets"
  ON public.revision_sheets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sheets"
  ON public.revision_sheets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sheets"
  ON public.revision_sheets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sheets"
  ON public.revision_sheets FOR DELETE
  USING (auth.uid() = user_id);

-- ── SCHEDULES ──
CREATE POLICY "Users can view own schedules"
  ON public.schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
  ON public.schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON public.schedules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON public.schedules FOR DELETE
  USING (auth.uid() = user_id);

-- ── GENERATED MESSAGES ──
CREATE POLICY "Users can view own messages"
  ON public.generated_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.generated_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON public.generated_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.generated_messages FOR DELETE
  USING (auth.uid() = user_id);

-- ── AI USAGE ──
CREATE POLICY "Users can view own usage"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
