CREATE TABLE public.preset_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preset_name text NOT NULL,
  preset_kind text NOT NULL DEFAULT 'animation',
  panel text NOT NULL DEFAULT 'ghost-text',
  vote text NOT NULL,
  device_fingerprint text NOT NULL,
  license_key text,
  app_version text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (preset_kind, preset_name, device_fingerprint)
);

GRANT ALL ON public.preset_votes TO service_role;
GRANT SELECT ON public.preset_votes TO authenticated;
ALTER TABLE public.preset_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read preset votes" ON public.preset_votes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.preset_votes_vote_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
begin
  if new.vote not in ('up','down') then
    raise exception 'vote must be up or down';
  end if;
  new.updated_at = now();
  return new;
end; $$;

CREATE TRIGGER preset_votes_guard BEFORE INSERT OR UPDATE ON public.preset_votes
FOR EACH ROW EXECUTE FUNCTION public.preset_votes_vote_guard();

CREATE TABLE public.panel_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  panel text NOT NULL DEFAULT 'unknown',
  message text NOT NULL,
  contact text,
  severity text NOT NULL DEFAULT 'issue',
  status text NOT NULL DEFAULT 'open',
  device_fingerprint text,
  license_key text,
  app_version text,
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.panel_reports TO service_role;
GRANT SELECT, UPDATE ON public.panel_reports TO authenticated;
ALTER TABLE public.panel_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read reports" ON public.panel_reports FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins update reports" ON public.panel_reports FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER panel_reports_touch BEFORE UPDATE ON public.panel_reports
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX preset_votes_name_idx ON public.preset_votes (preset_kind, preset_name);
CREATE INDEX panel_reports_created_idx ON public.panel_reports (created_at DESC);