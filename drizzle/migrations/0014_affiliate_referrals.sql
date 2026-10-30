CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  commission_percent integer NOT NULL DEFAULT 10 CHECK (commission_percent BETWEEN 0 AND 90),
  balance_bdt integer NOT NULL DEFAULT 0 CHECK (balance_bdt >= 0),
  total_earned_bdt integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliate reads own" ON public.affiliates FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL;

CREATE TABLE public.referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id uuid NOT NULL UNIQUE,
  coupon_code text NOT NULL,
  plan text,
  order_amount_bdt integer NOT NULL,
  commission_bdt integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','reversed','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_commissions TO authenticated;
GRANT ALL ON public.referral_commissions TO service_role;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliate reads own commissions" ON public.referral_commissions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()));

CREATE TABLE public.affiliate_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount_bdt integer NOT NULL CHECK (amount_bdt >= 200),
  payment_method text NOT NULL CHECK (payment_method IN ('bkash','nagad','rocket')),
  account_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','rejected')),
  trx_id text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliate_withdrawals TO authenticated;
GRANT ALL ON public.affiliate_withdrawals TO service_role;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliate reads own withdrawals" ON public.affiliate_withdrawals FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()));

-- Commission sync: pending on order create, approved on paid, reversed on refund/fail.
CREATE OR REPLACE FUNCTION public.affiliate_sync_order() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text := upper(coalesce(NEW.metadata->>'coupon',''));
  v_aff public.affiliates%ROWTYPE;
  v_com public.referral_commissions%ROWTYPE;
  v_paid boolean := NEW.status IN ('paid','activated');
  v_dead boolean := NEW.status IN ('refunded','failed','cancelled');
BEGIN
  IF v_code = '' THEN RETURN NEW; END IF;
  SELECT * INTO v_com FROM public.referral_commissions WHERE order_id = NEW.id FOR UPDATE;
  IF NOT FOUND THEN
    SELECT a.* INTO v_aff FROM public.coupons c JOIN public.affiliates a ON a.id = c.affiliate_id
      WHERE upper(c.code) = v_code LIMIT 1;
    IF NOT FOUND THEN RETURN NEW; END IF;
    -- self-referral block
    IF (NEW.user_id IS NOT NULL AND NEW.user_id = v_aff.user_id)
       OR (NEW.email IS NOT NULL AND lower(NEW.email) = lower(v_aff.email)) THEN RETURN NEW; END IF;
    INSERT INTO public.referral_commissions(affiliate_id, order_id, coupon_code, plan, order_amount_bdt, commission_bdt, status)
    VALUES (v_aff.id, NEW.id, v_code, NEW.plan, NEW.amount, floor(NEW.amount * v_aff.commission_percent / 100.0)::int, 'pending')
    RETURNING * INTO v_com;
  END IF;
  IF v_paid AND v_com.status = 'pending' THEN
    UPDATE public.referral_commissions SET status='approved', updated_at=now() WHERE id=v_com.id;
    UPDATE public.affiliates SET balance_bdt = balance_bdt + v_com.commission_bdt,
      total_earned_bdt = total_earned_bdt + v_com.commission_bdt, updated_at=now() WHERE id=v_com.affiliate_id;
  ELSIF v_dead AND v_com.status = 'approved' THEN
    UPDATE public.referral_commissions SET status='reversed', updated_at=now() WHERE id=v_com.id;
    UPDATE public.affiliates SET balance_bdt = greatest(0, balance_bdt - v_com.commission_bdt),
      total_earned_bdt = greatest(0, total_earned_bdt - v_com.commission_bdt), updated_at=now() WHERE id=v_com.affiliate_id;
  ELSIF v_dead AND v_com.status = 'pending' THEN
    UPDATE public.referral_commissions SET status='rejected', updated_at=now() WHERE id=v_com.id;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.affiliate_sync_order() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER orders_affiliate_sync AFTER INSERT OR UPDATE OF status, metadata ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.affiliate_sync_order();

-- Atomic withdrawal request by the signed-in affiliate.
CREATE OR REPLACE FUNCTION public.affiliate_request_withdrawal(p_amount integer, p_method text, p_account text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_aff public.affiliates%ROWTYPE; v_id uuid;
BEGIN
  SELECT * INTO v_aff FROM public.affiliates WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_affiliate'; END IF;
  IF v_aff.status <> 'active' THEN RAISE EXCEPTION 'suspended'; END IF;
  IF p_amount < 200 THEN RAISE EXCEPTION 'min_200'; END IF;
  IF p_amount > v_aff.balance_bdt THEN RAISE EXCEPTION 'insufficient'; END IF;
  IF p_method NOT IN ('bkash','nagad','rocket') OR p_account !~ '^01[3-9][0-9]{8}$' THEN RAISE EXCEPTION 'bad_account'; END IF;
  IF EXISTS (SELECT 1 FROM public.affiliate_withdrawals WHERE affiliate_id=v_aff.id AND status='pending') THEN RAISE EXCEPTION 'pending_exists'; END IF;
  UPDATE public.affiliates SET balance_bdt = balance_bdt - p_amount, updated_at=now() WHERE id=v_aff.id;
  INSERT INTO public.affiliate_withdrawals(affiliate_id, amount_bdt, payment_method, account_number)
  VALUES (v_aff.id, p_amount, p_method, p_account) RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.affiliate_request_withdrawal(integer,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.affiliate_request_withdrawal(integer,text,text) TO authenticated;

-- Admin settles a withdrawal; rejection refunds balance.
CREATE OR REPLACE FUNCTION public.affiliate_settle_withdrawal(p_id uuid, p_status text, p_trx text, p_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_w public.affiliate_withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO v_w FROM public.affiliate_withdrawals WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR v_w.status <> 'pending' THEN RAISE EXCEPTION 'not_pending'; END IF;
  IF p_status = 'paid' THEN
    IF coalesce(trim(p_trx),'') = '' THEN RAISE EXCEPTION 'trx_required'; END IF;
    UPDATE public.affiliate_withdrawals SET status='paid', trx_id=p_trx, admin_note=p_note, updated_at=now() WHERE id=p_id;
  ELSIF p_status = 'rejected' THEN
    UPDATE public.affiliate_withdrawals SET status='rejected', admin_note=p_note, updated_at=now() WHERE id=p_id;
    UPDATE public.affiliates SET balance_bdt = balance_bdt + v_w.amount_bdt, updated_at=now() WHERE id=v_w.affiliate_id;
  ELSE RAISE EXCEPTION 'bad_status'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.affiliate_settle_withdrawal(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_settle_withdrawal(uuid,text,text,text) TO service_role;