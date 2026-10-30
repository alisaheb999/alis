CREATE TABLE public.shopbot_products (
  id integer PRIMARY KEY,
  category_name text NOT NULL DEFAULT '',
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  usd_price numeric NOT NULL DEFAULT 0,
  stock_count integer NOT NULL DEFAULT 0,
  in_stock boolean NOT NULL DEFAULT false,
  min_qty integer NOT NULL DEFAULT 1,
  max_qty integer NOT NULL DEFAULT 1,
  title_bn text,
  description_bn text,
  price_override_bdt integer,
  visible boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shopbot_products TO anon, authenticated;
GRANT ALL ON public.shopbot_products TO service_role;
ALTER TABLE public.shopbot_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads visible shopbot products" ON public.shopbot_products FOR SELECT TO anon, authenticated USING (visible = true);

ALTER TABLE public.digital_orders
  ADD COLUMN supplier_product_id integer,
  ADD COLUMN quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN delivery_status text NOT NULL DEFAULT 'none',
  ADD COLUMN delivery_payload text,
  ADD COLUMN supplier_order_code text,
  ADD COLUMN delivery_error text;