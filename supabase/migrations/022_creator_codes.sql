-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 022 : Codes créateurs & rémunération
-- ═══════════════════════════════════════════════════════════════
-- Programme partenaire créateurs : chaque créateur reçoit un code personnalisé
-- (ex: "PSEUDO15") donnant -15% à sa communauté, et touche 15% des revenus
-- générés par ce code, y compris sur les paiements récurrents (pas seulement
-- le premier). Un créateur peut avoir un compte OptiNote (owner_user_id) pour
-- consulter ses propres statistiques ; sinon le code reste géré côté admin.

CREATE TABLE IF NOT EXISTS public.creator_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  creator_name text NOT NULL,
  creator_email text,
  owner_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  discount_percent integer NOT NULL DEFAULT 15 CHECK (discount_percent > 0 AND discount_percent <= 100),
  commission_percent integer NOT NULL DEFAULT 15 CHECK (commission_percent > 0 AND commission_percent <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creator_codes_owner_idx ON public.creator_codes(owner_user_id);

-- Un client par code (première attribution durable, comme les parrainages) :
-- on sait qui a payé grâce à quel créateur, pour suivre les paiements récurrents.
CREATE TABLE IF NOT EXISTS public.creator_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_code_id uuid NOT NULL REFERENCES public.creator_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creator_code_redemptions_code_idx ON public.creator_code_redemptions(creator_code_id);

-- Registre des paiements (un par facture payée) : base du calcul de commission
-- et du suivi de ce qui a déjà été reversé au créateur. stripe_invoice_id est
-- unique pour empêcher tout double comptage si le webhook Stripe est rejoué.
CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_code_id uuid NOT NULL REFERENCES public.creator_codes(id) ON DELETE CASCADE,
  stripe_invoice_id text NOT NULL UNIQUE,
  amount_cents integer NOT NULL,
  commission_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'eur',
  paid_out boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creator_earnings_code_idx ON public.creator_earnings(creator_code_id);

ALTER TABLE public.creator_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_code_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- Un créateur ne voit que son(ses) propre(s) code(s) ; toute écriture (création
-- de code, redemptions, earnings) passe exclusivement par la clé de service
-- côté serveur (admin ou webhook Stripe déjà vérifié), jamais par le client.
DROP POLICY IF EXISTS "Creators can view their own codes" ON public.creator_codes;
CREATE POLICY "Creators can view their own codes"
  ON public.creator_codes FOR SELECT
  USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Creators can view their own redemptions" ON public.creator_code_redemptions;
CREATE POLICY "Creators can view their own redemptions"
  ON public.creator_code_redemptions FOR SELECT
  USING (
    creator_code_id IN (
      SELECT id FROM public.creator_codes WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Creators can view their own earnings" ON public.creator_earnings;
CREATE POLICY "Creators can view their own earnings"
  ON public.creator_earnings FOR SELECT
  USING (
    creator_code_id IN (
      SELECT id FROM public.creator_codes WHERE owner_user_id = auth.uid()
    )
  );
