-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 009 : Statut lu/non-lu des messages privés
-- ═══════════════════════════════════════════════════════════════
-- Nécessaire pour afficher un badge de notification sur l'onglet Campus.

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages (receiver_id, is_read)
  WHERE receiver_id IS NOT NULL AND is_read = false;
