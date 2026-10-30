CREATE OR REPLACE FUNCTION public.guard_cross_catalogue_payment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE method text; transaction_ref text; row_id uuid; BEGIN
 method=NEW.payment_method; row_id=NEW.id;
 IF TG_TABLE_NAME='orders' THEN transaction_ref=upper(NEW.transaction_id); ELSE transaction_ref=upper(NEW.trx_id); END IF;
 IF transaction_ref IS NULL OR length(transaction_ref)=0 OR method='cod' THEN RETURN NEW; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(method||':'||transaction_ref,0));
 IF EXISTS(SELECT 1 FROM public.digital_orders WHERE payment_method=method AND upper(trx_id)=transaction_ref AND (TG_TABLE_NAME<>'digital_orders' OR id<>row_id)) OR EXISTS(SELECT 1 FROM public.orders WHERE payment_method=method AND upper(transaction_id)=transaction_ref AND (TG_TABLE_NAME<>'orders' OR id<>row_id)) OR EXISTS(SELECT 1 FROM public.gear_orders WHERE payment_method=method AND upper(trx_id)=transaction_ref AND (TG_TABLE_NAME<>'gear_orders' OR id<>row_id)) THEN RAISE EXCEPTION 'Payment transaction already used'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER guard_cross_digital BEFORE INSERT OR UPDATE OF trx_id,payment_method ON public.digital_orders FOR EACH ROW EXECUTE FUNCTION public.guard_cross_catalogue_payment();
CREATE TRIGGER guard_cross_orders BEFORE INSERT OR UPDATE OF transaction_id,payment_method ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_cross_catalogue_payment();
CREATE TRIGGER guard_cross_gear BEFORE INSERT OR UPDATE OF trx_id,payment_method ON public.gear_orders FOR EACH ROW EXECUTE FUNCTION public.guard_cross_catalogue_payment();
CREATE OR REPLACE FUNCTION public.guard_digital_order_limits() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.ip_hash IS NOT NULL THEN PERFORM pg_advisory_xact_lock(hashtextextended('digital-ip:'||NEW.ip_hash,0)); IF (SELECT count(*) FROM public.digital_orders WHERE ip_hash=NEW.ip_hash AND created_at>=now()-interval '1 hour')>=5 THEN RAISE EXCEPTION 'Too many recent orders'; END IF; END IF;
 IF NEW.quantity<>1 THEN RAISE EXCEPTION 'Digital orders require one item'; END IF; RETURN NEW; END $$;
CREATE TRIGGER guard_digital_limits BEFORE INSERT ON public.digital_orders FOR EACH ROW EXECUTE FUNCTION public.guard_digital_order_limits();