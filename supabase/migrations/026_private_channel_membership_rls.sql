-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 026 : RLS des messages de salon privé
-- ═══════════════════════════════════════════════════════════════
-- La migration 023 corrigeait la fuite des messages privés (DM), mais
-- documentait sciemment un choix : laisser tout utilisateur authentifié lire
-- n'importe quel message de salon (channel_id IS NOT NULL), y compris ceux
-- d'un salon créé avec isPrivate=true (POST /api/campus/channels). Or l'app
-- présente bien "isPrivate" comme une vraie option de confidentialité à
-- l'utilisateur qui crée un groupe d'étude — la policy RLS ne tenait pas
-- cette promesse : un utilisateur connaissant l'UUID d'un salon privé (par
-- exemple via un lien partagé par erreur, ou une future fuite d'ID) pouvait
-- lire tous ses messages directement via le SDK Supabase, indépendamment de
-- toute vérification faite côté route API.
--
-- Cette migration restreint la lecture des messages de salon : les salons
-- publics (is_private = false, le cas des salons de spécialité et des
-- groupes d'étude non-privés) restent ouverts à tout utilisateur connecté,
-- comme avant ; les salons privés ne sont désormais lisibles que par leurs
-- membres (table channel_members). Les DM restent inchangés.

DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "Users can view messages"
  ON public.messages FOR SELECT
  USING (
    (
      channel_id IS NOT NULL
      AND (
        NOT EXISTS (
          SELECT 1 FROM public.chat_channels c
          WHERE c.id = messages.channel_id AND c.is_private
        )
        OR EXISTS (
          SELECT 1 FROM public.channel_members m
          WHERE m.channel_id = messages.channel_id AND m.user_id = auth.uid()
        )
      )
    )
    OR auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR auth.uid() = user_id
  );
