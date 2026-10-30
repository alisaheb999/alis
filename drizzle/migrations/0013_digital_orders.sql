CREATE TABLE public.digital_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code text NOT NULL UNIQUE,
  product_slug text NOT NULL,
  product_name text NOT NULL,
  amount_bdt integer NOT NULL CHECK (amount_bdt > 0),
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_whatsapp text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('bkash','nagad','rocket','upay')),
  sender_number text NOT NULL,
  trx_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','delivered','cancelled')),
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.digital_orders TO authenticated;
GRANT ALL ON public.digital_orders TO service_role;
ALTER TABLE public.digital_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read digital orders" ON public.digital_orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update digital orders" ON public.digital_orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX digital_orders_created_idx ON public.digital_orders (created_at DESC);
CREATE INDEX digital_orders_ip_idx ON public.digital_orders (ip_hash, created_at);
CREATE TRIGGER digital_orders_touch BEFORE UPDATE ON public.digital_orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();