-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 024 : Verrouille les champs d'identité des lycées
-- ═══════════════════════════════════════════════════════════════
-- La policy UPDATE de public.schools (migration 010) est USING(true)/WITH
-- CHECK(true) pour tout utilisateur connecté : nécessaire pour que
-- /api/campus/schools/select puisse incrémenter students_count et compléter
-- latitude/longitude manquantes quand un élève rejoint un lycée existant —
-- mais elle laisse aussi n'importe qui réécrire le nom, la ville, le code
-- postal ou l'académie de N'IMPORTE QUEL lycée. Ce trigger ne bloque que ces
-- champs d'identité pour un utilisateur normal, sans toucher au flux
-- legitime (students_count/latitude/longitude restent librement modifiables).
CREATE OR REPLACE FUNCTION public.prevent_school_field_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.name IS DISTINCT FROM OLD.name
    OR NEW.city IS DISTINCT FROM OLD.city
    OR NEW.postal_code IS DISTINCT FROM OLD.postal_code
    OR NEW.academy IS DISTINCT FROM OLD.academy
  THEN
    RAISE EXCEPTION 'Modification non autorisée : ce champ ne peut être modifié que par le serveur.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_school_field_tampering_trigger ON public.schools;
CREATE TRIGGER prevent_school_field_tampering_trigger
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_school_field_tampering();
