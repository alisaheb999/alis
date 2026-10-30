ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS product_key text;

UPDATE public.licenses
SET product_key = CASE
  WHEN lower(coalesce(plan, '')) IN ('lifetime', 'text_lifetime', 'text')
    OR lower(coalesce(plan, '')) LIKE '%text%' THEN 'text'
  ELSE 'caption'
END
WHERE product_key IS NULL;

CREATE OR REPLACE FUNCTION public.ghost_set_license_product_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.product_key := CASE
    WHEN lower(coalesce(NEW.plan, '')) IN ('lifetime', 'text_lifetime', 'text')
      OR lower(coalesce(NEW.plan, '')) LIKE '%text%' THEN 'text'
    ELSE 'caption'
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS licenses_product_key_guard ON public.licenses;
CREATE TRIGGER licenses_product_key_guard
BEFORE INSERT OR UPDATE OF plan ON public.licenses
FOR EACH ROW EXECUTE FUNCTION public.ghost_set_license_product_key();

CREATE UNIQUE INDEX IF NOT EXISTS licenses_one_product_per_user
ON public.licenses (user_id, product_key)
WHERE user_id IS NOT NULL;

ALTER TABLE public.free_resources ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.free_resources
SET slug = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) || '-' || left(id::text, 6)
WHERE slug IS NULL OR trim(slug) = '';

CREATE UNIQUE INDEX IF NOT EXISTS free_resources_slug_unique
ON public.free_resources (slug)
WHERE slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.ghost_set_resource_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
    NEW.slug := trim(both '-' from regexp_replace(lower(NEW.title), '[^a-z0-9]+', '-', 'g')) || '-' || left(NEW.id::text, 6);
  ELSE
    NEW.slug := trim(both '-' from regexp_replace(lower(NEW.slug), '[^a-z0-9]+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS free_resources_slug_guard ON public.free_resources;
CREATE TRIGGER free_resources_slug_guard
BEFORE INSERT OR UPDATE OF slug, title ON public.free_resources
FOR EACH ROW EXECUTE FUNCTION public.ghost_set_resource_slug();

CREATE POLICY "Public resource images are readable"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'free-resource-images');

CREATE POLICY "Admins manage resource images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'free-resource-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'free-resource-images' AND public.has_role(auth.uid(), 'admin'));