CREATE TABLE public.extension_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key text NOT NULL,
  name text NOT NULL,
  host_app text NOT NULL DEFAULT 'after-effects',
  version text NOT NULL,
  cep_folder text NOT NULL,
  changelog text,
  thumbnail_url text,
  is_free boolean NOT NULL DEFAULT false,
  storage_path text NOT NULL,
  sha256 text,
  size_bytes bigint,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.extension_releases TO service_role;
GRANT SELECT ON public.extension_releases TO authenticated;
ALTER TABLE public.extension_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read releases" ON public.extension_releases FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX extension_releases_product_idx ON public.extension_releases(product_key, host_app, created_at DESC);
CREATE TRIGGER extension_releases_touch BEFORE UPDATE ON public.extension_releases FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();