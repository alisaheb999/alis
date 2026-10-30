revoke all on function public.asset_facets() from public;
revoke all on function public.asset_facets() from anon;
revoke all on function public.asset_facets() from authenticated;
grant execute on function public.asset_facets() to service_role;