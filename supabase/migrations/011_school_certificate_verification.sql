-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 011 : Vérification par certificat de scolarité
-- ═══════════════════════════════════════════════════════════════
-- Remplace le système de vérification par pièce d'identité (migration 005,
-- jamais appliquée en production) par une vérification basée uniquement sur
-- le certificat de scolarité. Colonnes créées directement avec les bons noms
-- puisqu'aucune donnée réelle n'existait sous l'ancien schéma.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'none'
    CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS school_certificate_url text,
  ADD COLUMN IF NOT EXISTS verification_note text;

-- Bucket de stockage privé pour les certificats de scolarité
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-certificates', 'school-certificates', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own school certificate"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'school-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own school certificate"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'school-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own school certificate"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'school-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);
