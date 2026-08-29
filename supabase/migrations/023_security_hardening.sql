-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 023 : Durcissement sécurité (audit pré-lancement)
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. CRITIQUE : empêche l'auto-élévation de privilèges sur profiles
-- ─────────────────────────────────────────────────────────────
-- La policy RLS "Users can update own profile" (migration 001) n'est
-- restreinte qu'au niveau de la LIGNE (auth.uid() = id), jamais des
-- colonnes. Un utilisateur connecté pouvait donc appeler directement
-- l'API REST Supabase avec son propre token (clé anonyme publique + JWT)
-- pour s'auto-attribuer is_admin, is_pro, un statut d'abonnement actif,
-- le badge "Lycéen Vérifié", etc. — sans jamais passer par les routes
-- serveur qui font les vérifications réelles (paiement Stripe confirmé,
-- analyse IA du certificat...).
--
-- Ce trigger bloque toute modification de ces colonnes sensibles par une
-- requête authentifiée normale (rôle "authenticated"). Les routes serveur
-- qui doivent légitimement les modifier (webhook Stripe, /api/stripe/sync,
-- /api/stripe/verify-session, /api/stripe/change-plan, /api/stripe/checkout,
-- /api/verification/analyze-certificate, /api/waitlist/redeem,
-- /api/admin/verifications) ont été mises à jour pour utiliser la clé de
-- service (createAdminClient), qui contourne ce trigger comme prévu.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
    OR NEW.is_pro IS DISTINCT FROM OLD.is_pro
    OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
    OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
    OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
    OR NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
    OR NEW.subscription_current_period_end IS DISTINCT FROM OLD.subscription_current_period_end
    OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
    OR NEW.free_months_credit IS DISTINCT FROM OLD.free_months_credit
  THEN
    RAISE EXCEPTION 'Modification non autorisée : ce champ ne peut être modifié que par le serveur.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- Note : beta_access_redeemed_at n'est volontairement PAS inclus ci-dessus.
-- /api/waitlist/redeem utilise déjà la clé de service pour l'écrire, mais le
-- protéger aussi nécessiterait de revoir ce flux plus en profondeur ; risque
-- résiduel accepté pour l'instant (accès Pro gratuit non autorisé, au pire
-- pendant la fenêtre bêta du 30-31 août 2026, jamais un accès admin/financier).

-- ─────────────────────────────────────────────────────────────
-- 2. Nettoyage d'une policy RLS permissive résiduelle sur messages
-- ─────────────────────────────────────────────────────────────
-- La migration 002 créait "Read messages in accessible channels" avec
-- USING (true) — lisible par TOUT utilisateur authentifié, y compris les
-- messages privés (DM) d'autrui. La migration 004 a bien ajouté une policy
-- plus correcte ("Users can view messages" : salons ouverts à tous les
-- connectés + DM restreints à l'expéditeur/destinataire), mais son DROP
-- POLICY IF EXISTS visait un nom différent de celui de la 002, donc
-- l'ancienne policy USING(true) n'a probablement jamais été supprimée. Les
-- policies RLS SELECT sont cumulatives (logique OU) : si elle est encore
-- active, elle seule suffit à exposer tous les DM privés, peu importe les
-- policies plus restrictives ajoutées après.
--
-- Les salons de discussion étant volontairement ouverts à tous les
-- lycéens connectés (pas de notion d'adhésion préalable requise pour lire),
-- on ne restreint PAS ici l'accès aux messages de salon — seule la fuite
-- des DM privés via cette policy résiduelle est corrigée.
DROP POLICY IF EXISTS "Read messages in accessible channels" ON public.messages;

-- Recrée la policy 004 pour garantir son existence quel que soit l'état réel
-- de la base (idempotent, sans changer son comportement voulu).
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "Users can view messages"
  ON public.messages FOR SELECT
  USING (
    channel_id IS NOT NULL
    OR auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR auth.uid() = user_id
  );

-- ─────────────────────────────────────────────────────────────
-- 3. Limites serveur sur le bucket school-certificates (jusqu'ici aucune)
-- ─────────────────────────────────────────────────────────────
-- Contrairement au bucket "avatars" (migration 018), celui-ci n'avait ni
-- file_size_limit ni allowed_mime_types — seule une vérification côté
-- client (contournable) limitait la taille/le type de fichier.
UPDATE storage.buckets
SET file_size_limit = 8388608, -- 8 Mo, aligné sur la limite déjà annoncée côté client
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf']
WHERE id = 'school-certificates';
