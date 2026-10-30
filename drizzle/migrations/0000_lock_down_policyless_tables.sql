-- These six tables are written/read only by trusted server code (service_role).
-- RLS was enabled but no policies existed; make the intent explicit and revoke
-- any client-side privileges so no browser session can reach them.

-- payments
REVOKE ALL ON public.payments FROM anon, authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read payments" ON public.payments;
CREATE POLICY "Admins can read payments" ON public.payments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- usage_counters
REVOKE ALL ON public.usage_counters FROM anon, authenticated;
GRANT ALL ON public.usage_counters TO service_role;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read usage counters" ON public.usage_counters;
CREATE POLICY "Admins can read usage counters" ON public.usage_counters
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- security_blocks
REVOKE ALL ON public.security_blocks FROM anon, authenticated;
GRANT ALL ON public.security_blocks TO service_role;
ALTER TABLE public.security_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read security blocks" ON public.security_blocks;
CREATE POLICY "Admins can read security blocks" ON public.security_blocks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- page_views
REVOKE ALL ON public.page_views FROM anon, authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read page views" ON public.page_views;
CREATE POLICY "Admins can read page views" ON public.page_views
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- download_events
REVOKE ALL ON public.download_events FROM anon, authenticated;
GRANT ALL ON public.download_events TO service_role;
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read download events" ON public.download_events;
CREATE POLICY "Admins can read download events" ON public.download_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- vault_sync_state (internal bookkeeping, no client access at all)
REVOKE ALL ON public.vault_sync_state FROM anon, authenticated;
GRANT ALL ON public.vault_sync_state TO service_role;
ALTER TABLE public.vault_sync_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read vault sync state" ON public.vault_sync_state;
CREATE POLICY "Admins can read vault sync state" ON public.vault_sync_state
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));