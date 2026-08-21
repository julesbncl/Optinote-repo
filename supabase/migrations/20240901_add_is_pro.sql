-- Migration: Add is_pro column to profiles table
-- This column provides a simple boolean flag for Pro access control.
-- It complements the existing subscription_tier / subscription_status fields.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;

-- Update is_pro for any user who already has an active paid subscription
UPDATE public.profiles
SET is_pro = true
WHERE subscription_status IN ('active', 'trialing')
  AND subscription_tier IN ('monthly', 'annual');

-- Index for fast Pro lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro ON public.profiles (is_pro);
