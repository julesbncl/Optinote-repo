-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 007 : Tighten is_channel_member() execute grants
-- ═══════════════════════════════════════════════════════════════
-- Supabase Security Advisor flagged is_channel_member (added in 006) as
-- publicly executable via the blanket PUBLIC role. Behavior is
-- unchanged (anon + authenticated could already call it through
-- PUBLIC); this just replaces the blanket grant with explicit ones so
-- it's not exposed to any future/other role by default.

REVOKE EXECUTE ON FUNCTION public.is_channel_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_channel_member(uuid, uuid) TO anon, authenticated;
