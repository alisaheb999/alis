CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  customer_name text,
  plan text NOT NULL,
  cycle text NOT NULL DEFAULT 'monthly',
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'BDT',
  provider text NOT NULL DEFAULT 'zinipay',
  invoice_id text,
  transaction_id text,
  payment_method text,
  status text NOT NULL DEFAULT 'pending',
  license_key text,
  device_limit integer NOT NULL DEFAULT 2,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX orders_invoice_id_key ON public.orders (invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX orders_user_id_idx ON public.orders (user_id);
CREATE INDEX orders_email_idx ON public.orders (lower(email));

GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own orders read" ON public.orders
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );

CREATE POLICY "admins read orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins write orders" ON public.orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();