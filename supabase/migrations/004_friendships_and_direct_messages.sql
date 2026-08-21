-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 004 : Friendships & Direct Messaging Realtime
-- ═══════════════════════════════════════════════════════════════

-- 1. Table Friendships (Amis & Demandes de contact)
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- 2. Évolution de la table Messages pour supporter les canaux et les DMs privés
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Rendre channel_id optionnel pour les messages privés directs
ALTER TABLE public.messages ALTER COLUMN channel_id DROP NOT NULL;

-- Initialiser sender_id à partir de user_id pour les anciens messages
UPDATE public.messages SET sender_id = user_id WHERE sender_id IS NULL AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_direct ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.messages(channel_id, created_at DESC);

-- 3. Sécurité Row Level Security (RLS)
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friendship requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendship status"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Messages RLS
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "Users can view messages"
  ON public.messages FOR SELECT
  USING (
    channel_id IS NOT NULL 
    OR auth.uid() = sender_id 
    OR auth.uid() = receiver_id 
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id OR auth.uid() = user_id
  );

-- 4. Publication Realtime Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
