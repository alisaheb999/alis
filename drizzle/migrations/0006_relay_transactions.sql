CREATE TABLE public.relay_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.relay_devices(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('bkash','nagad','rocket','upay')),
  trx_id text NOT NULL,
  amount integer NOT NULL,
  sender text,
  received_at timestamptz,
  raw_text text,
  match_status text NOT NULL DEFAULT 'unmatched',
  matched_order_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, trx_id)
);
GRANT SELECT ON public.relay_transactions TO authenticated;
GRANT ALL ON public.relay_transactions TO service_role;
ALTER TABLE public.relay_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read relay transactions" ON public.relay_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));