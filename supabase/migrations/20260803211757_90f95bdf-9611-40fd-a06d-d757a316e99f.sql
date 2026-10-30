-- Lock down storage.objects for the private ghost-assets bucket.
-- Files are served through server-side signed URLs (service role, which bypasses RLS),
-- so no direct client read/write access is needed. Admins keep full access.

DROP POLICY IF EXISTS "ghost_assets_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "ghost_assets_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "ghost_assets_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "ghost_assets_admin_delete" ON storage.objects;

CREATE POLICY "ghost_assets_admin_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ghost-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ghost_assets_admin_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ghost-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ghost_assets_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ghost-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'ghost-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ghost_assets_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ghost-assets' AND public.has_role(auth.uid(), 'admin'));