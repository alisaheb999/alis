create or replace function public.asset_facets()
returns table (pack text, category text, asset_type text, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(a.meta_data->>'pack', ''), 'other')      as pack,
    coalesce(nullif(a.meta_data->>'category', ''), 'other')  as category,
    a.type                                                   as asset_type,
    count(*)                                                 as total
  from public.assets a
  where a.published = true
  group by 1, 2, 3
  order by 1, 2
$$;

grant execute on function public.asset_facets() to service_role;
grant execute on function public.asset_facets() to authenticated;