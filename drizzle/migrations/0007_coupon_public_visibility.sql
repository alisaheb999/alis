ALTER TABLE public.coupons ADD COLUMN is_public boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.coupons.is_public IS 'Owner-selected public coupon advertising; never automatic storefront pricing.';
CREATE FUNCTION public.published_coupon_banners() RETURNS TABLE(code text, percent_off integer, flat_off integer, plans text[]) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT c.code, c.percent_off, c.flat_off, c.plans FROM public.coupons c WHERE c.is_public AND c.active AND (c.starts_at IS NULL OR c.starts_at <= now()) AND (c.expires_at IS NULL OR c.expires_at > now()) AND (c.max_redemptions = 0 OR c.redeemed_count < c.max_redemptions) ORDER BY c.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.published_coupon_banners() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.published_coupon_banners() TO anon, authenticated, service_role;