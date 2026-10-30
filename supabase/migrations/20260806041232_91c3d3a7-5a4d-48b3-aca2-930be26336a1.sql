
-- Create app_role enum if it doesn't exist
do $$ begin
  create type public.app_role as enum ('admin', 'moderator', 'user');
exception
  when duplicate_object then null;
end $$;

-- Set up the user_roles table
create table if not exists public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
);

-- Grant Data API access
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

-- Enable RLS
alter table public.user_roles enable row level security;

-- Security Definer Function to check role
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS for user_roles
create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can manage all roles"
on public.user_roles for all
to authenticated
using (public.has_role(auth.uid(), 'admin'));
