-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 012 : Conversations privées automatiques
-- ═══════════════════════════════════════════════════════════════
-- Table de liaison "conversations" pour chaque paire d'utilisateurs, créée
-- automatiquement dès qu'une amitié est acceptée (et, en filet de sécurité,
-- dès le premier message échangé même sans amitié). Les messages eux-mêmes
-- restent stockés dans public.messages (sender_id/receiver_id) — cette table
-- ne fait que suivre la paire + la dernière activité, pour lister les amis
-- triés par conversation la plus récente sans recalculer ça à chaque requête.

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_ordered_pair CHECK (user_a_id < user_b_id),
  CONSTRAINT conversations_unique_pair UNIQUE (user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_a ON public.conversations(user_a_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_b ON public.conversations(user_b_id, last_message_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Pas de politique INSERT/UPDATE pour les utilisateurs : seules les fonctions
-- SECURITY DEFINER déclenchées par trigger ci-dessous écrivent dans cette table.

-- 1. Création automatique à l'acceptation d'une demande d'ami
CREATE OR REPLACE FUNCTION public.handle_friendship_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    INSERT INTO public.conversations (user_a_id, user_b_id)
    VALUES (LEAST(NEW.user_id, NEW.friend_id), GREATEST(NEW.user_id, NEW.friend_id))
    ON CONFLICT (user_a_id, user_b_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_friendship_accepted ON public.friendships;
CREATE TRIGGER trg_friendship_accepted
  AFTER UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_friendship_accepted();

-- 2. Création / mise à jour à chaque message direct (filet de sécurité si les
-- deux utilisateurs échangent avant d'être formellement "amis", et suivi de
-- la dernière activité pour trier la liste des amis).
CREATE OR REPLACE FUNCTION public.handle_new_direct_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_id IS NOT NULL AND NEW.receiver_id IS NOT NULL THEN
    INSERT INTO public.conversations (user_a_id, user_b_id, last_message_at, last_message_preview)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id),
      NEW.created_at,
      LEFT(NEW.content, 140)
    )
    ON CONFLICT (user_a_id, user_b_id) DO UPDATE
    SET last_message_at = EXCLUDED.last_message_at,
        last_message_preview = EXCLUDED.last_message_preview;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_direct_message ON public.messages;
CREATE TRIGGER trg_new_direct_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_direct_message();

-- Ces deux fonctions ne sont invoquées que par les triggers ci-dessus (jamais
-- appelées directement par un client) : pas besoin qu'elles soient exécutables
-- publiquement.
REVOKE EXECUTE ON FUNCTION public.handle_friendship_accepted() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_direct_message() FROM PUBLIC;

-- 3. Realtime : la liste des amis doit se mettre à jour en direct
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- 4. Rétro-remplissage des amitiés et messages déjà existants
INSERT INTO public.conversations (user_a_id, user_b_id)
SELECT DISTINCT LEAST(f.user_id, f.friend_id), GREATEST(f.user_id, f.friend_id)
FROM public.friendships f
WHERE f.status = 'accepted'
ON CONFLICT (user_a_id, user_b_id) DO NOTHING;

WITH latest AS (
  SELECT DISTINCT ON (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
    LEAST(sender_id, receiver_id) AS ua,
    GREATEST(sender_id, receiver_id) AS ub,
    created_at,
    content
  FROM public.messages
  WHERE sender_id IS NOT NULL AND receiver_id IS NOT NULL
  ORDER BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC
)
INSERT INTO public.conversations (user_a_id, user_b_id, last_message_at, last_message_preview)
SELECT ua, ub, created_at, LEFT(content, 140) FROM latest
ON CONFLICT (user_a_id, user_b_id) DO UPDATE
SET last_message_at = EXCLUDED.last_message_at,
    last_message_preview = EXCLUDED.last_message_preview;
