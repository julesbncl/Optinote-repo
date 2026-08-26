-- Préférences de notification par e-mail, activées par défaut pour tout le monde.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notif_messages boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_notif_friends boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_notif_revisions boolean NOT NULL DEFAULT true;
