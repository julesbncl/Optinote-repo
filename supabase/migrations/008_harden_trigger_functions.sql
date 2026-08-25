-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 008 : Harden remaining Security Advisor warnings
-- ═══════════════════════════════════════════════════════════════
-- handle_new_user() and rls_auto_enable() are only ever invoked by
-- triggers (on_auth_user_created / a DDL event trigger), never called
-- directly by application code or RLS policies, so no role needs
-- direct EXECUTE on them — revoking from PUBLIC removes the "Public
-- Can Execute SECURITY DEFINER Function" warning with no behavior
-- change (Postgres trigger firing does not require the triggering
-- role to hold EXECUTE on the trigger function).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;

-- update_updated_at() had no search_path set at all (unlike the other
-- two, which already had safe explicit values). Fixes "Function Search
-- Path Mutable".
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;
