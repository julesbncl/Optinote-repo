-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 013 : Sessions de révision en groupe (réelles)
-- ═══════════════════════════════════════════════════════════════
-- "Proposer une révision" n'écrivait qu'en mémoire locale (React state),
-- jamais en base — donc rien n'était partagé entre utilisateurs ni ne
-- survivait à un rechargement. Ces deux tables rendent le flux réel.

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('online', 'in_person')),
  location text,
  date_time_label text NOT NULL,
  max_participants integer NOT NULL DEFAULT 4 CHECK (max_participants BETWEEN 2 AND 20),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_created ON public.study_sessions(created_at DESC);

CREATE TABLE IF NOT EXISTS public.study_session_participants (
  session_id uuid NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_session_participants_user ON public.study_session_participants(user_id);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_session_participants ENABLE ROW LEVEL SECURITY;

-- Toute personne connectée voit toutes les sessions (annuaire public du Campus)
CREATE POLICY "Authenticated users can view study sessions"
  ON public.study_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own study session"
  ON public.study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own study session"
  ON public.study_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "Authenticated users can view participants"
  ON public.study_session_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join a session themselves"
  ON public.study_session_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave a session themselves"
  ON public.study_session_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- L'hôte est automatiquement inscrit comme participant de sa propre session
CREATE OR REPLACE FUNCTION public.handle_new_study_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.study_session_participants (session_id, user_id)
  VALUES (NEW.id, NEW.host_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_study_session ON public.study_sessions;
CREATE TRIGGER trg_new_study_session
  AFTER INSERT ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_study_session();

REVOKE EXECUTE ON FUNCTION public.handle_new_study_session() FROM PUBLIC;

ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_session_participants;
