# Extension Release Hub (low-credit plan)

Admin uploads an extension ZIP once, and the desktop software sees it in its list automatically.

## What the admin gets
- A new "Release Hub" tab in the admin panel.
- Form: product (Text, Caption...), app (After Effects / Premiere Pro), version, CEP folder name, short changelog, thumbnail link, ZIP file.
- Button "Publish": the ZIP is saved, its fingerprint (SHA-256) is calculated, and the release appears in the desktop list.
- List of published releases with "Hide" (unpublish) and "Make latest".
- A small "Desktop app update" box: version, Windows/Mac installer link, notes, mandatory on/off.

## What the desktop software gets
- The existing list endpoint returns every published release: name, version, app, folder name, changelog, thumbnail, checksum and a short-lived download link.
- Download links are given only to users with a valid licence for that product (free products: everyone).
- Nothing changes in existing licences or activations.

## Technical details
- Private storage bucket `extension-releases` (public buckets disabled); signed URLs (~15 min).
- New table `extension_releases` (product_key, host_app, version, cep_folder, changelog, thumbnail_url, storage_path, sha256, size, published, created_at) with GRANTs + RLS: admins only; server reads via admin client.
- Admin server functions (`requireSupabaseAuth` + `has_role admin`) for upload-URL, publish, toggle.
- SHA-256 computed server-side after upload.
- `/desktop/catalog` reads the table; new `GET /desktop/download?release_id=` checks the bearer desktop token + licence, returns signed URL.
- Desktop app-update settings keep using `extension_settings` (module `desktop`, key `app`).
- Verify: upload a test ZIP, call catalog + download with a real licence.
