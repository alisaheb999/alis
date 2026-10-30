CREATE TABLE public.preset_fix_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preset_name text NOT NULL,
  preset_kind text NOT NULL,
  panel text NOT NULL DEFAULT 'ghost-toolkit',
  status text NOT NULL DEFAULT 'pending',
  down_votes integer NOT NULL DEFAULT 0,
  up_votes integer NOT NULL DEFAULT 0,
  admin_note text,
  agent_note text,
  fixed_in_version text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (preset_kind, preset_name)
);

GRANT SELECT ON public.preset_fix_queue TO authenticated;
GRANT ALL ON public.preset_fix_queue TO service_role;

ALTER TABLE public.preset_fix_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read fix queue" ON public.preset_fix_queue
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER preset_fix_queue_touch
  BEFORE UPDATE ON public.preset_fix_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();