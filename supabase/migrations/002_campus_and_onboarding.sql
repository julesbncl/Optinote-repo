-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 002 : Campus Social, Carte & Onboarding
-- ═══════════════════════════════════════════════════════════════

-- 1. Table des Lycées (Schools)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  academy TEXT,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  students_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schools_city ON public.schools(city);
CREATE INDEX IF NOT EXISTS idx_schools_geo ON public.schools(latitude, longitude);

-- 2. Enrichissement de la table Profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS academic_goal TEXT CHECK (academic_goal IN ('excellence', 'progression', 'bac_mention', 'rattrapage')),
  ADD COLUMN IF NOT EXISTS post_bac_target TEXT CHECK (post_bac_target IN ('scientifique', 'sante', 'eco_droit', 'litteraire', 'ingenieur', 'art', 'autre')),
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_visible_on_school BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles(school_id);

-- 3. Canaux de discussion (Chat Channels)
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('subject', 'school', 'general', 'study_group')),
  subject_tag TEXT,
  class_level TEXT,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_channels_type ON public.chat_channels(type);
CREATE INDEX IF NOT EXISTS idx_channels_school ON public.chat_channels(school_id);

-- 4. Membres des salons (Channel Members)
CREATE TABLE IF NOT EXISTS public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_channel_user ON public.channel_members(channel_id, user_id);

-- 5. Messages de chat (Messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON public.messages(channel_id, created_at DESC);

-- 6. Signalements pour mineurs (Message Reports)
CREATE TABLE IF NOT EXISTS public.message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('harcelement', 'propos_inappropries', 'spam', 'divulgation_donnees', 'autre')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ═══════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

-- Schools: Lecture publique
CREATE POLICY "Public read access to schools"
  ON public.schools FOR SELECT
  USING (true);

-- Channels: Lecture des salons publics ou de son lycée
CREATE POLICY "View public or joined channels"
  ON public.chat_channels FOR SELECT
  USING (
    is_private = false 
    OR school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
    OR id IN (SELECT channel_id FROM public.channel_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Create channels"
  ON public.chat_channels FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Channel Members
CREATE POLICY "View members of accessible channels"
  ON public.channel_members FOR SELECT
  USING (true);

CREATE POLICY "Join public channels"
  ON public.channel_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leave channels"
  ON public.channel_members FOR DELETE
  USING (auth.uid() = user_id);

-- Messages
CREATE POLICY "Read messages in accessible channels"
  ON public.messages FOR SELECT
  USING (true);

CREATE POLICY "Send messages to channels"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Message Reports
CREATE POLICY "Users can report messages"
  ON public.message_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- ═══════════════════════════════════════════════════════
-- SEED DATA : Lycées & Salons par défaut
-- ═══════════════════════════════════════════════════════

INSERT INTO public.schools (id, name, city, postal_code, academy, latitude, longitude, students_count) VALUES
('11111111-1111-1111-1111-111111111101', 'Lycée Henri IV', 'Paris', '75005', 'Académie de Paris', 48.8458, 2.3486, 128),
('11111111-1111-1111-1111-111111111102', 'Lycée Louis-le-Grand', 'Paris', '75005', 'Académie de Paris', 48.8480, 2.3444, 142),
('11111111-1111-1111-1111-111111111103', 'Lycée du Parc', 'Lyon', '69006', 'Académie de Lyon', 45.7705, 4.8569, 95),
('11111111-1111-1111-1111-111111111104', 'Lycée Thiers', 'Marseille', '13001', 'Académie d''Aix-Marseille', 43.2989, 5.3831, 84),
('11111111-1111-1111-1111-111111111105', 'Lycée Pierre-de-Fermat', 'Toulouse', '31000', 'Académie de Toulouse', 43.6033, 1.4398, 110),
('11111111-1111-1111-1111-111111111106', 'Lycée Michel Montaigne', 'Bordeaux', '33000', 'Académie de Bordeaux', 44.8344, -0.5750, 78),
('11111111-1111-1111-1111-111111111107', 'Lycée Faidherbe', 'Lille', '59000', 'Académie de Lille', 50.6186, 3.0689, 67),
('11111111-1111-1111-1111-111111111108', 'Lycée Clemenceau', 'Nantes', '44000', 'Académie de Nantes', 47.2197, -1.5456, 89),
('11111111-1111-1111-1111-111111111109', 'Lycée International des Pontonniers', 'Strasbourg', '67000', 'Académie de Strasbourg', 48.5838, 7.7558, 54),
('11111111-1111-1111-1111-111111111110', 'Lycée Masséna', 'Nice', '06000', 'Académie de Nice', 43.7003, 7.2721, 62)
ON CONFLICT (id) DO NOTHING;

-- Salons de discussion thématiques officiels
INSERT INTO public.chat_channels (id, name, description, type, subject_tag, class_level, is_private) VALUES
('22222222-2222-2222-2222-222222222201', '📐 Spécialité Mathématiques', 'Entraide, exercices et révisions pour la spé Maths (Première & Terminale)', 'subject', 'maths', NULL, false),
('22222222-2222-2222-2222-222222222202', '⚡ Spécialité Physique-Chimie', 'Résolution de TP, formules et méthodologie en Physique-Chimie', 'subject', 'physique', NULL, false),
('22222222-2222-2222-2222-222222222203', '🧬 Spécialité SVT', 'Schémas bilans, génétique, géologie et révisions SVT', 'subject', 'svt', NULL, false),
('22222222-2222-2222-2222-222222222204', '📈 Spécialité SES', 'Économie, sociologie et fiches de notions clés', 'subject', 'ses', NULL, false),
('22222222-2222-2222-2222-222222222205', '💻 Spécialité NSI & Informatique', 'Code Python, algorithmes, bases de données et projets', 'subject', 'nsi', NULL, false),
('22222222-2222-2222-2222-222222222206', '🏛️ Spécialité HGGSP', 'Histoire, géopolitique et sciences politiques', 'subject', 'hggsp', NULL, false),
('22222222-2222-2222-2222-222222222207', '✍️ Spécialité HLP & Philo', 'Humanités, littérature, philosophie et méthode de dissertation', 'subject', 'hlp', NULL, false),
('22222222-2222-2222-2222-222222222208', '🎯 Objectif Bac 2026 (Général)', 'Conseils d''organisation, révisions du Grand Oral et motivation collective', 'general', 'bac', NULL, false)
ON CONFLICT (id) DO NOTHING;
