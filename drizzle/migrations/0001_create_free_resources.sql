CREATE TABLE public.free_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  download_url text NOT NULL,
  tutorial_url text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.free_resources TO anon, authenticated;
GRANT ALL ON public.free_resources TO service_role;

ALTER TABLE public.free_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published free resources are public"
ON public.free_resources
FOR SELECT
TO anon, authenticated
USING (is_published = true);

CREATE TRIGGER free_resources_touch
BEFORE UPDATE ON public.free_resources
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();