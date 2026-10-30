CREATE TABLE IF NOT EXISTS public.public_offers (
  id uuid primary key default gen_random_uuid(),
  plan text not null unique,
  discount integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT ALL ON public.public_offers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_offers TO authenticated;

ALTER TABLE public.public_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage public offers"
  ON public.public_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER public_offers_touch
  BEFORE UPDATE ON public.public_offers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();