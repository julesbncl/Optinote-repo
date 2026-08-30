-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 027 : accès Pro gratuit permanent pour les créateurs
-- ═══════════════════════════════════════════════════════════════
-- Un créateur partenaire (propriétaire d'un code créateur actif, voir
-- migration 022) doit avoir accès à Pro gratuitement en continu, y compris
-- après la fin de la période d'accès gratuit général du 1er septembre — en
-- échange de la promotion qu'il fait du site. Ce champ est dénormalisé sur
-- profiles (plutôt que de recalculer depuis creator_codes à chaque vérif
-- Pro) pour rester cohérent avec le fonctionnement existant de is_pro, et
-- pour que checkIsPro()/isUserSubscribed() restent des fonctions synchrones
-- ne nécessitant pas de requête supplémentaire.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_creator_partner boolean NOT NULL DEFAULT false;

-- Rattrapage pour les codes créateurs déjà liés à un compte avant cette
-- migration.
UPDATE public.profiles p
SET is_creator_partner = true
WHERE EXISTS (
  SELECT 1 FROM public.creator_codes cc
  WHERE cc.owner_user_id = p.id AND cc.is_active = true
);
