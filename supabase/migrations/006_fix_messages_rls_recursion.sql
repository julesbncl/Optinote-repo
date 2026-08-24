-- ═══════════════════════════════════════════════════════════════
-- OptiNote — Migration 006 : Fix infinite recursion on messages/channel_members RLS
-- ═══════════════════════════════════════════════════════════════
-- pg_policies showed the real, currently-active policy names (they don't
-- match any single migration file, since 00_full_schema.sql,
-- 002_campus_and_onboarding.sql and 004 each layered their own):
--   messages.messages_insert_members / messages_select_members
--     -> reference channel_members, redundant with migration 004's
--        "Users can insert messages" / "Users can view messages"
--        (which already cover channel_id IS NOT NULL messages too)
--   channel_members.channel_members_select
--     -> self-references channel_members inside its own USING clause,
--        which Postgres cannot resolve (infinite recursion, error 42P17)

DROP POLICY IF EXISTS "messages_insert_members" ON public.messages;
DROP POLICY IF EXISTS "messages_select_members" ON public.messages;

-- SECURITY DEFINER helper: runs with elevated privilege, so querying
-- channel_members from inside it does NOT re-trigger channel_members'
-- own RLS policy, breaking the recursion cycle.
CREATE OR REPLACE FUNCTION public.is_channel_member(p_channel_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE channel_id = p_channel_id AND user_id = p_user_id
  );
$$;

DROP POLICY IF EXISTS "channel_members_select" ON public.channel_members;
CREATE POLICY "channel_members_select" ON public.channel_members
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_channel_member(channel_id, auth.uid()));
