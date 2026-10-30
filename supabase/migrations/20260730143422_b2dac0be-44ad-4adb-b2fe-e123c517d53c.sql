-- profile auto-creation for new sign-ups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user();

-- backfill profiles for existing users
insert into public.profiles (id, email, display_name)
select u.id, u.email, split_part(coalesce(u.email,''),'@',1)
from auth.users u
on conflict (id) do nothing;

-- grant admin role to the owner account
insert into public.user_roles (user_id, role)
select u.id, 'admin'::app_role from auth.users u where lower(u.email) = 'info@vfsbd.site'
on conflict (user_id, role) do nothing;