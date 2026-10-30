CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  day date NOT NULL DEFAULT (now()::date),
  views integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (path, day)
);
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.security_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id uuid REFERENCES public.licenses(id) ON DELETE SET NULL,
  license_key text,
  device_fingerprint text,
  ip_address text,
  reason text NOT NULL,
  signal_count integer NOT NULL DEFAULT 1,
  auto boolean NOT NULL DEFAULT true,
  blocked_at timestamp with time zone NOT NULL DEFAULT now(),
  unblocked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.security_blocks TO service_role;
ALTER TABLE public.security_blocks ENABLE ROW LEVEL SECURITY;
CREATE INDEX security_blocks_open_idx ON public.security_blocks (blocked_at DESC) WHERE unblocked_at IS NULL;

CREATE OR REPLACE FUNCTION public.ghost_bump_page_view(p_path text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.page_views (path, day, views)
  VALUES (left(p_path, 300), now()::date, 1)
  ON CONFLICT (path, day) DO UPDATE
    SET views = public.page_views.views + 1, updated_at = now();
$$;
REVOKE ALL ON FUNCTION public.ghost_bump_page_view(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ghost_bump_page_view(text) TO service_role;