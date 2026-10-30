CREATE TABLE public.digital_delivery_secrets (order_id uuid PRIMARY KEY REFERENCES public.digital_orders(id), payload text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.digital_delivery_secrets TO service_role;
ALTER TABLE public.digital_delivery_secrets ENABLE ROW LEVEL SECURITY;
INSERT INTO public.digital_delivery_secrets(order_id,payload) SELECT id,delivery_payload FROM public.digital_orders WHERE delivery_payload IS NOT NULL ON CONFLICT(order_id) DO NOTHING;
UPDATE public.digital_orders SET delivery_payload=NULL WHERE delivery_payload IS NOT NULL;
COMMENT ON COLUMN public.digital_orders.delivery_payload IS 'DEPRECATED: private delivery material lives in digital_delivery_secrets';
ALTER TABLE public.digital_orders ADD COLUMN payment_verified_at timestamptz, ADD COLUMN payment_verification_source text;
CREATE OR REPLACE FUNCTION public.guard_digital_order() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF TG_OP='INSERT' THEN
 IF NEW.status<>'pending' OR NEW.delivery_status<>'none' THEN RAISE EXCEPTION 'Orders must begin pending'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.payment_method||':'||upper(NEW.trx_id),0));
 IF EXISTS(SELECT 1 FROM public.digital_orders WHERE payment_method=NEW.payment_method AND upper(trx_id)=upper(NEW.trx_id)) OR EXISTS(SELECT 1 FROM public.orders WHERE payment_method=NEW.payment_method AND upper(transaction_id)=upper(NEW.trx_id)) OR EXISTS(SELECT 1 FROM public.gear_orders WHERE payment_method=NEW.payment_method AND upper(trx_id)=upper(NEW.trx_id)) THEN RAISE EXCEPTION 'Payment transaction already used'; END IF;
 NEW.trx_id=upper(NEW.trx_id);
ELSE
 IF NEW.status<>OLD.status THEN
 IF NOT ((OLD.status='pending' AND NEW.status IN ('paid','cancelled')) OR (OLD.status='paid' AND NEW.status='delivered')) THEN RAISE EXCEPTION 'Invalid order transition'; END IF;
 IF NEW.status='paid' AND (NEW.payment_verified_at IS NULL OR NEW.payment_verification_source IS NULL) THEN RAISE EXCEPTION 'Payment confirmation required'; END IF;
 IF NEW.status='delivered' AND (NEW.delivery_status<>'delivered' OR NOT EXISTS(SELECT 1 FROM public.digital_delivery_secrets WHERE order_id=NEW.id)) THEN RAISE EXCEPTION 'Verified delivery required'; END IF;
 IF NEW.status='cancelled' AND (OLD.delivery_status<>'none') THEN RAISE EXCEPTION 'Processing order cannot be cancelled'; END IF;
 END IF;
END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.allocate_digital_key(p_order uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE o public.digital_orders; k public.digital_key_inventory; BEGIN
SELECT * INTO o FROM public.digital_orders WHERE id=p_order FOR UPDATE;
IF NOT FOUND OR o.status NOT IN ('paid','delivered') OR o.product_slug<>'chatgpt-plus-renew' THEN RETURN false; END IF;
SELECT * INTO k FROM public.digital_key_inventory WHERE order_id=p_order FOR UPDATE;
IF NOT FOUND THEN
 SELECT * INTO k FROM public.digital_key_inventory WHERE product_slug=o.product_slug AND order_id IS NULL ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1;
 IF NOT FOUND THEN UPDATE public.digital_orders SET delivery_status='failed',delivery_error='Key inventory unavailable' WHERE id=p_order; RETURN false; END IF;
END IF;
UPDATE public.digital_key_inventory SET order_id=p_order,assigned_at=COALESCE(assigned_at,now()) WHERE id=k.id;
INSERT INTO public.digital_delivery_secrets(order_id,payload) VALUES(p_order,k.license_key) ON CONFLICT(order_id) DO NOTHING;
UPDATE public.digital_orders SET status='delivered',delivery_status='delivered',delivery_payload=NULL,delivery_error=NULL WHERE id=p_order;
RETURN true; END $$;
REVOKE ALL ON FUNCTION public.allocate_digital_key(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_digital_key(uuid) TO service_role;
CREATE TABLE public.digital_reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL UNIQUE REFERENCES public.digital_orders(id), product_slug text NOT NULL, display_name text NOT NULL, rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), body text NOT NULL CHECK(length(body) BETWEEN 10 AND 2000), screenshot text, reply text, approved boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.digital_reviews TO service_role;
ALTER TABLE public.digital_reviews ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.public_digital_reviews(p_slug text) RETURNS TABLE(id uuid,display_name text,rating integer,body text,screenshot text,reply text,created_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT id,display_name,rating,body,screenshot,reply,created_at FROM public.digital_reviews WHERE product_slug=p_slug AND approved ORDER BY created_at DESC LIMIT 100 $$;
REVOKE ALL ON FUNCTION public.public_digital_reviews(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_digital_reviews(text) TO anon,authenticated,service_role;
COMMENT ON TABLE public.canboso_products IS 'DEFERRED: owner requested no further Canboso dependency or connection prompts';