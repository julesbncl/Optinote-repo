-- Classement entre amis : opt-in explicite requis, désactivé par défaut (donnée sensible).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS leaderboard_opt_in boolean NOT NULL DEFAULT false;

-- Parrainage : code unique par utilisateur + crédit de mois offerts en attente
-- d'utilisation (ex: le parrain n'est pas encore abonné au moment de la conversion).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS free_months_credit integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  CONSTRAINT no_self_referral CHECK (referrer_id <> referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Chacun ne voit que les parrainages où il est impliqué (comme parrain ou filleul).
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Un utilisateur ne peut créer QUE la ligne où IL est le filleul (jamais au nom
-- d'un autre) ; la contrainte UNIQUE sur referred_id empêche toute réclamation
-- multiple, et la contrainte CHECK empêche l'auto-parrainage au niveau base.
-- Le passage en "converted" (et la récompense) n'est fait que côté serveur via
-- la clé de service, jamais par les utilisateurs eux-mêmes.
DROP POLICY IF EXISTS "Users can claim a referral for themselves" ON public.referrals;
CREATE POLICY "Users can claim a referral for themselves"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);
