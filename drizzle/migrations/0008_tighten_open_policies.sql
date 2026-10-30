DROP POLICY IF EXISTS "Anyone can report errors" ON public.extension_errors;
DROP POLICY IF EXISTS "Vault catalogue is publicly readable" ON public.vault_assets;
DROP POLICY IF EXISTS "Public resource images are readable" ON storage.objects;