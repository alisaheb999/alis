ALTER TABLE public.gear_products ADD COLUMN IF NOT EXISTS brand text NOT NULL DEFAULT '';
ALTER TABLE public.gear_products ADD COLUMN IF NOT EXISTS stock_qty integer NOT NULL DEFAULT 0;
ALTER TABLE public.gear_products ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE public.gear_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code text NOT NULL UNIQUE DEFAULT ('GG-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  district text NOT NULL DEFAULT '',
  thana text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal_bdt integer NOT NULL DEFAULT 0,
  delivery_zone text NOT NULL DEFAULT 'inside_dhaka',
  delivery_charge_bdt integer NOT NULL DEFAULT 0,
  discount_bdt integer NOT NULL DEFAULT 0,
  total_bdt integer NOT NULL DEFAULT 0,
  cost_bdt integer NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cod',
  payment_status text NOT NULL DEFAULT 'unpaid',
  trx_id text,
  courier text,
  tracking_code text,
  status text NOT NULL DEFAULT 'pending',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gear_orders TO authenticated;
GRANT ALL ON public.gear_orders TO service_role;
ALTER TABLE public.gear_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage gear orders" ON public.gear_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER gear_orders_touch BEFORE UPDATE ON public.gear_orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();