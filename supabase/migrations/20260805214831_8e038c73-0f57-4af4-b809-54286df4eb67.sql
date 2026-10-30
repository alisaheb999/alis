CREATE TABLE IF NOT EXISTS public.text_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  tier text NOT NULL DEFAULT 'free',
  ffx_path text NOT NULL,
  preview_path text,
  sort_order integer NOT NULL DEFAULT 100,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.text_styles TO anon;
GRANT SELECT ON public.text_styles TO authenticated;
GRANT ALL ON public.text_styles TO service_role;

ALTER TABLE public.text_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published text styles are readable"
  ON public.text_styles FOR SELECT
  USING (published = true);

CREATE POLICY "Admins manage text styles"
  ON public.text_styles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER text_styles_touch BEFORE UPDATE ON public.text_styles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();