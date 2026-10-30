CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  percent_off integer not null default 0,
  flat_off integer not null default 0,
  plans text[] not null default '{}',
  max_redemptions integer not null default 0,
  redeemed_count integer not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage coupons"
  ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER coupons_touch
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.pricing_plans (plan_key, name_en, name_bn, price_monthly, price_yearly, currency, tokens_monthly, device_limit, badge, description_en, description_bn, sort_order, visible)
VALUES
  ('free',  'Free',    'ফ্রি',        0,    0,     'BDT', 0,     1, NULL,        'Core panels with limited assets.',       'সীমিত অ্যাসেট সহ মূল প্যানেল।',        10, true),
  ('pro',   'Premium', 'প্রিমিয়াম',  399,  3999,  'BDT', 500,   2, 'Popular',   'Full asset library and AI tokens.',      'সম্পূর্ণ লাইব্রেরি ও এআই টোকেন।',      20, true),
  ('ultra', 'Ultra',   'আলট্রা',      999,  9999,  'BDT', 3000,  3, 'Best value','Everything in Premium plus more tokens.','প্রিমিয়ামের সব কিছু ও বেশি টোকেন।',   30, true),
  ('team',  'Team',    'টিম',         1999, 19999, 'BDT', 10000, 5, NULL,        'Five seats for studios and teams.',      'স্টুডিও ও টিমের জন্য পাঁচটি সিট।',    40, true)
ON CONFLICT (plan_key) DO NOTHING;