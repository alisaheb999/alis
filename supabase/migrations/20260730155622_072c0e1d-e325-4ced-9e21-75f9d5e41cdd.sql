
INSERT INTO public.assets (title, slug, type, file_path, bucket, access_level, size_bytes, meta_data, published)
SELECT
  initcap(replace(regexp_replace(split_part(o.name, '/', 3), '\.png$', '', 'i'), '-', ' ')) AS title,
  'flag-' || lower(regexp_replace(regexp_replace(split_part(o.name, '/', 3), '\.png$', '', 'i'), '[^a-zA-Z0-9]+', '-', 'g')) AS slug,
  'flag' AS type,
  o.name AS file_path,
  'ghost-assets' AS bucket,
  'licensed'::asset_access AS access_level,
  (o.metadata->>'size')::bigint AS size_bytes,
  jsonb_build_object(
    'pack', 'flags',
    'category', split_part(o.name, '/', 2),
    'folder', 'flags/' || split_part(o.name, '/', 2),
    'file_name', split_part(o.name, '/', 3),
    'mime', o.metadata->>'mimetype',
    'tags', to_jsonb(ARRAY[
      'flag',
      'icon',
      split_part(o.name, '/', 2),
      lower(replace(regexp_replace(split_part(o.name, '/', 3), '\.png$', '', 'i'), '-', ' '))
    ])
  ) AS meta_data,
  true AS published
FROM storage.objects o
WHERE o.bucket_id = 'ghost-assets'
  AND o.name LIKE 'flags/%'
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS assets_type_idx ON public.assets (type);
CREATE INDEX IF NOT EXISTS assets_meta_gin_idx ON public.assets USING gin (meta_data jsonb_path_ops);
CREATE INDEX IF NOT EXISTS assets_title_trgm_idx ON public.assets (lower(title) text_pattern_ops);
