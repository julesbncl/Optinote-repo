-- La table schedules n'a jamais eu de contrainte d'unicité sur (user_id,
-- week_start), alors que TOUT le code (génération IA, ajustement IA, édition
-- manuelle de créneau, scan d'emploi du temps) utilise upsert(..., { onConflict:
-- 'user_id,week_start' }) en s'appuyant dessus. Résultat : chaque tentative de
-- sauvegarde échouait silencieusement avec "there is no unique or exclusion
-- constraint matching the ON CONFLICT specification" — confirmé par un test
-- direct, et par le fait que la table est actuellement totalement vide malgré
-- des mois d'utilisation de ces fonctionnalités.
ALTER TABLE public.schedules
  ADD CONSTRAINT schedules_user_week_unique UNIQUE (user_id, week_start);
