CREATE TABLE public.canboso_products (id text PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '', product_type text NOT NULL DEFAULT 'account', cost numeric NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'USD', stock integer, requirements jsonb NOT NULL DEFAULT '{}', selling_price_bdt integer, visible boolean NOT NULL DEFAULT false, synced_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.canboso_products TO anon,authenticated;
GRANT ALL ON public.canboso_products TO service_role;
ALTER TABLE public.canboso_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY canboso_public_catalogue ON public.canboso_products FOR SELECT TO anon,authenticated USING(visible);
CREATE POLICY canboso_admin_read ON public.canboso_products FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
ALTER TABLE public.digital_orders ADD COLUMN IF NOT EXISTS canboso_product_id text, ADD COLUMN IF NOT EXISTS supplier_cost numeric, ADD COLUMN IF NOT EXISTS supplier_currency text;