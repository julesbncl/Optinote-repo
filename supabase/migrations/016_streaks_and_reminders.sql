-- Série de connexion (streak), rappel de planning par e-mail, et suivi de
-- l'évolution de la moyenne générale pour les notifications de progression.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date date,
  ADD COLUMN IF NOT EXISTS email_notif_planning_reminder boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_notif_grade_evolution boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_known_average numeric;
