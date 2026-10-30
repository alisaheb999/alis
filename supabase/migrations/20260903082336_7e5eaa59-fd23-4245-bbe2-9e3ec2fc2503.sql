CREATE TABLE public.preset_downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key text NOT NULL,
  preset_slug text NOT NULL,
  panel text NOT NULL DEFAULT 'text',
  device_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (license_key, panel, preset_slug)
);
CREATE INDEX preset_downloads_key_idx ON public.preset_downloads (license_key, panel);
GRANT ALL ON public.preset_downloads TO service_role;
ALTER TABLE public.preset_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins can read preset downloads" ON public.preset_downloads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));