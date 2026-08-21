-- ═══════════════════════════════════════════════════════
-- Migration: 005_id_verification_system.sql
-- OptiNote Account Verification by ID / Student Card
-- ═══════════════════════════════════════════════════════

-- 1. Add verification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected'));

-- 2. Create Storage Bucket for secure ID documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS Policies
CREATE POLICY "Users can upload their own ID document"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own ID document"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own ID document"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
