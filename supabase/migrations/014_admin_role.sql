-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 014 : Rôle admin (revue certificats & signalements)
-- ═══════════════════════════════════════════════════════════════
-- Sans ça, les certificats en "pending" et les signalements de messages
-- n'ont aucun endroit pour être traités : la RLS actuelle sur
-- message_reports ne laisse voir un signalement qu'à son auteur, pas à
-- un administrateur.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET is_admin = true WHERE email = 'julesbonicemo@gmail.com';
