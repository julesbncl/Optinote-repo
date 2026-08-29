-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 025 : Rate limiting distribué (persistant)
-- ═══════════════════════════════════════════════════════════════
-- L'ancien rate limiter (src/lib/rate-limit.ts) était une Map en mémoire,
-- propre à un seul processus. Sur Vercel, chaque instance serverless a sa
-- propre mémoire (et un cold start la remet à zéro), donc le compteur
-- réel était multiplié par le nombre d'instances actives — une protection
-- best-effort, pas une vraie garantie. Cette table + fonction remplacent la
-- mémoire par un compteur partagé et persistant dans Postgres, avec un
-- verrou de ligne (FOR UPDATE) qui rend l'incrément atomique même en cas de
-- requêtes concurrentes sur la même clé.

CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- Jamais interrogée directement par un client : uniquement via la fonction
-- SECURITY DEFINER ci-dessous, appelée côté serveur avec la clé de service.
ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_ms integer
)
RETURNS TABLE(allowed boolean, remaining integer, reset_in_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_count integer;
  v_elapsed_ms double precision;
BEGIN
  INSERT INTO public.rate_limit_hits (key, count, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO NOTHING;

  SELECT rlh.count, rlh.window_start INTO v_count, v_window_start
  FROM public.rate_limit_hits rlh
  WHERE rlh.key = p_key
  FOR UPDATE;

  v_elapsed_ms := EXTRACT(EPOCH FROM (v_now - v_window_start)) * 1000;

  -- Nettoyage opportuniste (~1% des appels), pour éviter une croissance
  -- illimitée de la table sans dépendre de pg_cron (pas activé sur tous les
  -- projets Supabase).
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limit_hits WHERE window_start < v_now - interval '1 hour';
  END IF;

  IF v_elapsed_ms > p_window_ms THEN
    UPDATE public.rate_limit_hits SET count = 1, window_start = v_now WHERE key = p_key;
    RETURN QUERY SELECT true, p_max_requests - 1, CEIL(p_window_ms / 1000.0)::integer;
    RETURN;
  END IF;

  IF v_count >= p_max_requests THEN
    RETURN QUERY SELECT false, 0, GREATEST(CEIL((p_window_ms - v_elapsed_ms) / 1000.0)::integer, 1);
    RETURN;
  END IF;

  UPDATE public.rate_limit_hits SET count = count + 1 WHERE key = p_key;
  RETURN QUERY SELECT true, p_max_requests - (v_count + 1), CEIL((p_window_ms - v_elapsed_ms) / 1000.0)::integer;
END;
$$;
