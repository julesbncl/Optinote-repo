-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Schéma Complet de Base de Données
-- À coller directement dans l'éditeur SQL de Supabase
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. TABLE : profiles (utilisateurs)
--    Liée à auth.users via la clé primaire id
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  full_name       text,
  avatar_url      text,
  class_level     text CHECK (class_level IN ('seconde', 'premiere', 'terminale', 'autre')),
  specialties     text[] NOT NULL DEFAULT '{}',
  academic_goal   text CHECK (academic_goal IN ('excellence', 'progression', 'bac_mention', 'rattrapage')),
  post_bac_target text CHECK (post_bac_target IN ('scientifique', 'sante', 'eco_droit', 'litteraire', 'ingenieur', 'art', 'autre')),
  school_id       uuid,
  school_name     text,
  latitude        double precision,
  longitude       double precision,
  is_visible      boolean NOT NULL DEFAULT true,
  bio             text,
  is_visible_on_school boolean NOT NULL DEFAULT true,
  onboarding_completed boolean NOT NULL DEFAULT false,

  -- Abonnement & Statut Pro
  stripe_customer_id              text,
  subscription_tier               text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'monthly', 'annual')),
  subscription_status             text NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'inactive')),
  is_pro                          boolean NOT NULL DEFAULT false,
  subscription_current_period_end timestamptz,

  preferences     jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Assurer la présence des colonnes si la table existe déjà
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Index pour recherches rapides sur le statut Pro & géolocalisation
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro ON public.profiles (is_pro);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_geo ON public.profiles (latitude, longitude) WHERE is_visible = true;


-- ───────────────────────────────────────────────────────────────
-- 2. TRIGGER : Création automatique du profil à l'inscription
--    Chaque nouvel utilisateur auth.users → profil automatique
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà pour éviter les doublons
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ───────────────────────────────────────────────────────────────
-- 3. TRIGGER : Mise à jour automatique de updated_at
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ───────────────────────────────────────────────────────────────
-- 4. TABLE : subjects (matières scolaires)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subjects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  coefficient  numeric NOT NULL DEFAULT 1,
  teacher_name text,
  color        text NOT NULL DEFAULT '#6366f1',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects (user_id);


-- ───────────────────────────────────────────────────────────────
-- 5. TABLE : grades (notes)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grades (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id   uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  value        numeric NOT NULL,
  out_of       numeric NOT NULL DEFAULT 20,
  coefficient  numeric NOT NULL DEFAULT 1,
  label        text,
  trimester    smallint NOT NULL DEFAULT 1 CHECK (trimester IN (1, 2, 3)),
  date         date,
  is_simulated boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grades_user_id ON public.grades (user_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades (subject_id);


-- ───────────────────────────────────────────────────────────────
-- 6. TABLE : folders (dossiers de fiches de révision)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  parent_id  uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders (user_id);


-- ───────────────────────────────────────────────────────────────
-- 7. TABLE : revision_sheets (fiches de révision IA)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.revision_sheets (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id          uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  subject_id         uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  title              text NOT NULL,
  original_text      text,
  original_image_url text,
  content            text NOT NULL DEFAULT '',
  key_concepts       text[] NOT NULL DEFAULT '{}',
  summary            text,
  source_type        text NOT NULL DEFAULT 'manual' CHECK (source_type IN ('text', 'photo', 'manual')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revision_sheets_user_id ON public.revision_sheets (user_id);
CREATE INDEX IF NOT EXISTS idx_revision_sheets_folder_id ON public.revision_sheets (folder_id);

DROP TRIGGER IF EXISTS set_revision_sheets_updated_at ON public.revision_sheets;
CREATE TRIGGER set_revision_sheets_updated_at
  BEFORE UPDATE ON public.revision_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ───────────────────────────────────────────────────────────────
-- 8. TABLE : schedules (emplois du temps / planning IA)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedules (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start          date NOT NULL,
  timetable_image_url text,
  constraints         jsonb NOT NULL DEFAULT '{}',
  homework            jsonb NOT NULL DEFAULT '[]',
  generated_plan      jsonb NOT NULL DEFAULT '[]',
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules (user_id);


-- ───────────────────────────────────────────────────────────────
-- 9. TABLE : generated_messages (messages IA générés)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.generated_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type      text NOT NULL CHECK (message_type IN ('absence', 'retard', 'question', 'rdv', 'rattrapage', 'autre')),
  context           text NOT NULL DEFAULT '',
  teacher_name      text,
  generated_content text NOT NULL DEFAULT '',
  is_favorite       boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_messages_user_id ON public.generated_messages (user_id);


-- ───────────────────────────────────────────────────────────────
-- 10. TABLE : ai_usage (suivi de consommation IA)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  tokens_used integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage (user_id);


-- ═══════════════════════════════════════════════════════════════
-- CAMPUS SOCIAL — Tables pour la carte interactive & l'entraide
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 11. TABLE : schools (lycées sur la carte de France)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schools (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  city            text NOT NULL,
  postal_code     text NOT NULL,
  academy         text,
  latitude        double precision NOT NULL,
  longitude       double precision NOT NULL,
  students_count  integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schools_postal_code ON public.schools (postal_code);

-- Lier le school_id de profiles à la table schools
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_school
  FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE SET NULL;


-- ───────────────────────────────────────────────────────────────
-- 12. TABLE : chat_channels (salons d'entraide)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  type        text NOT NULL DEFAULT 'general' CHECK (type IN ('subject', 'school', 'general', 'study_group')),
  subject_tag text,
  class_level text,
  school_id   uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_private  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_channels_school_id ON public.chat_channels (school_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON public.chat_channels (type);


-- ───────────────────────────────────────────────────────────────
-- 13. TABLE : channel_members (membres des salons)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.channel_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON public.channel_members (channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON public.channel_members (user_id);


-- ───────────────────────────────────────────────────────────────
-- 14. TABLE : messages (messages dans les salons)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id  uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     text NOT NULL,
  is_flagged  boolean NOT NULL DEFAULT false,
  flag_reason text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages (channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);


-- ───────────────────────────────────────────────────────────────
-- 15. TABLE : message_reports (signalements de messages)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason      text NOT NULL CHECK (reason IN ('harcelement', 'propos_inappropries', 'spam', 'divulgation_donnees', 'autre')),
  details     text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_reports_message_id ON public.message_reports (message_id);


-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Chaque utilisateur ne peut accéder qu'à ses propres données
-- ═══════════════════════════════════════════════════════════════

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Les profils visibles sur le campus (pour la carte et les salons)
CREATE POLICY "Profils visibles sur le campus"
  ON public.profiles FOR SELECT
  USING (is_visible_on_school = true);

-- ── SUBJECTS ──
CREATE POLICY "Utilisateur voit ses matières"
  ON public.subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur crée ses matières"
  ON public.subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utilisateur modifie ses matières"
  ON public.subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur supprime ses matières"
  ON public.subjects FOR DELETE USING (auth.uid() = user_id);

-- ── GRADES ──
CREATE POLICY "Utilisateur voit ses notes"
  ON public.grades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur crée ses notes"
  ON public.grades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utilisateur modifie ses notes"
  ON public.grades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur supprime ses notes"
  ON public.grades FOR DELETE USING (auth.uid() = user_id);

-- ── FOLDERS ──
CREATE POLICY "Utilisateur voit ses dossiers"
  ON public.folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur crée ses dossiers"
  ON public.folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utilisateur modifie ses dossiers"
  ON public.folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur supprime ses dossiers"
  ON public.folders FOR DELETE USING (auth.uid() = user_id);

-- ── REVISION_SHEETS ──
CREATE POLICY "Utilisateur voit ses fiches"
  ON public.revision_sheets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur crée ses fiches"
  ON public.revision_sheets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utilisateur modifie ses fiches"
  ON public.revision_sheets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur supprime ses fiches"
  ON public.revision_sheets FOR DELETE USING (auth.uid() = user_id);

-- ── SCHEDULES ──
CREATE POLICY "Utilisateur voit ses plannings"
  ON public.schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur crée ses plannings"
  ON public.schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utilisateur modifie ses plannings"
  ON public.schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur supprime ses plannings"
  ON public.schedules FOR DELETE USING (auth.uid() = user_id);

-- ── GENERATED_MESSAGES ──
CREATE POLICY "Utilisateur voit ses messages générés"
  ON public.generated_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur crée ses messages générés"
  ON public.generated_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utilisateur modifie ses messages générés"
  ON public.generated_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur supprime ses messages générés"
  ON public.generated_messages FOR DELETE USING (auth.uid() = user_id);

-- ── AI_USAGE ──
CREATE POLICY "Utilisateur voit sa consommation IA"
  ON public.ai_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Utilisateur enregistre sa consommation IA"
  ON public.ai_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── SCHOOLS (lecture publique) ──
CREATE POLICY "Tout le monde peut voir les lycées"
  ON public.schools FOR SELECT
  USING (true);

-- ── CHAT_CHANNELS (lecture publique, création par utilisateurs connectés) ──
CREATE POLICY "Tout le monde peut voir les salons publics"
  ON public.chat_channels FOR SELECT
  USING (is_private = false);
CREATE POLICY "Utilisateurs connectés créent des salons"
  ON public.chat_channels FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- ── CHANNEL_MEMBERS ──
CREATE POLICY "Membres voient les membres du salon"
  ON public.channel_members FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_members.channel_id AND cm.user_id = auth.uid()
  ));
CREATE POLICY "Utilisateurs rejoignent un salon"
  ON public.channel_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utilisateurs quittent un salon"
  ON public.channel_members FOR DELETE
  USING (auth.uid() = user_id);

-- ── MESSAGES ──
CREATE POLICY "Membres du salon voient les messages"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = messages.channel_id AND cm.user_id = auth.uid()
  ));
CREATE POLICY "Membres du salon envoient des messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = messages.channel_id AND cm.user_id = auth.uid()
  ));

-- ── MESSAGE_REPORTS ──
CREATE POLICY "Utilisateur crée un signalement"
  ON public.message_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Utilisateur voit ses signalements"
  ON public.message_reports FOR SELECT
  USING (auth.uid() = reported_by);


-- ═══════════════════════════════════════════════════════════════
-- STORAGE : Bucket pour les photos de profil (avatars)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars publics en lecture"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Utilisateurs uploadent leur avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Utilisateurs mettent à jour leur avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ═══════════════════════════════════════════════════════════════
-- ✅ SCHÉMA COMPLET PRÊT — Colle ce script dans l'éditeur SQL
--    de Supabase et clique sur « Run » pour tout créer.
-- ═══════════════════════════════════════════════════════════════
