-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 010 : Autoriser l'ajout/mise à jour de lycées
-- ═══════════════════════════════════════════════════════════════
-- public.schools n'avait qu'une politique SELECT. Quand un élève rejoint un
-- lycée provenant de l'API Open Data (pas encore dans notre table), la route
-- /api/campus/schools/select tente de l'INSERT — bloqué par RLS (42501) — puis
-- retombe sur un id de secours non-UUID, ce qui fait échouer la mise à jour de
-- profiles.school_id (colonne UUID avec contrainte de clé étrangère vers
-- schools.id) : le lycée rejoint ne se reflète alors jamais dans le profil.

CREATE POLICY "Utilisateurs connectés ajoutent un lycée"
  ON public.schools FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Utilisateurs connectés mettent à jour un lycée"
  ON public.schools FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
