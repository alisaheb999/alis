-- ============ enums ============
create type public.app_role as enum ('admin','moderator','user');
create type public.license_status as enum ('inactive','active','suspended','revoked','expired');
create type public.asset_access as enum ('public','licensed','premium');

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile write" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- ============ roles ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "admins read roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- ============ shared updated_at ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- ============ licenses ============
create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  license_key text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  plan text not null default 'pro',
  status public.license_status not null default 'inactive',
  device_fingerprint text,
  domain text,
  max_activations integer not null default 2,
  activation_count integer not null default 0,
  activated_at timestamptz,
  expires_at timestamptz,
  last_seen_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index licenses_key_idx on public.licenses (license_key);
create index licenses_user_idx on public.licenses (user_id);
grant select on public.licenses to authenticated;
grant all on public.licenses to service_role;
alter table public.licenses enable row level security;
create policy "own licenses" on public.licenses for select to authenticated using (user_id = auth.uid());
create policy "admins read licenses" on public.licenses for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins write licenses" on public.licenses for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger licenses_touch before update on public.licenses
for each row execute function public.touch_updated_at();

-- ============ device activations ============
create table public.license_activations (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  device_fingerprint text not null,
  hostname text,
  platform text,
  app_version text,
  revoked boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (license_id, device_fingerprint)
);
grant select on public.license_activations to authenticated;
grant all on public.license_activations to service_role;
alter table public.license_activations enable row level security;
create policy "own activations" on public.license_activations for select to authenticated
  using (exists (select 1 from public.licenses l where l.id = license_id and l.user_id = auth.uid()));
create policy "admins manage activations" on public.license_activations for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ extension settings ============
create table public.extension_settings (
  id uuid primary key default gen_random_uuid(),
  module text not null default 'core',
  key text not null,
  value jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  is_public boolean not null default false,
  min_version text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module, key)
);
grant select on public.extension_settings to anon, authenticated;
grant all on public.extension_settings to service_role;
alter table public.extension_settings enable row level security;
create policy "public settings readable" on public.extension_settings for select to anon, authenticated using (is_public = true and enabled = true);
create policy "admins manage settings" on public.extension_settings for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger settings_touch before update on public.extension_settings
for each row execute function public.touch_updated_at();

-- ============ assets ============
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  type text not null default 'file',
  file_path text not null,
  bucket text not null default 'ghost-assets',
  access_level public.asset_access not null default 'licensed',
  size_bytes bigint,
  checksum text,
  meta_data jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.assets to anon, authenticated;
grant all on public.assets to service_role;
alter table public.assets enable row level security;
create policy "public assets readable" on public.assets for select to anon, authenticated
  using (published = true and access_level = 'public');
create policy "admins manage assets" on public.assets for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger assets_touch before update on public.assets
for each row execute function public.touch_updated_at();

-- ============ audit log ============
create table public.extension_logs (
  id uuid primary key default gen_random_uuid(),
  license_id uuid references public.licenses(id) on delete set null,
  license_key text,
  event text not null,
  status text not null default 'ok',
  device_fingerprint text,
  ip_address text,
  user_agent text,
  app_version text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index extension_logs_created_idx on public.extension_logs (created_at desc);
create index extension_logs_event_idx on public.extension_logs (event);
grant select on public.extension_logs to authenticated;
grant all on public.extension_logs to service_role;
alter table public.extension_logs enable row level security;
create policy "admins read logs" on public.extension_logs for select to authenticated
  using (public.has_role(auth.uid(),'admin'));

-- ============ seed remote config ============
insert into public.extension_settings (module, key, value, is_public, description) values
  ('core','feature_flags','{"removeBg":true,"toolkit":true,"editorBoard":true,"aiCommand":true}'::jsonb, true, 'Master feature switches for the panels'),
  ('core','min_supported_version','{"version":"3.5.0"}'::jsonb, true, 'Oldest build allowed to sync'),
  ('core','heartbeat','{"intervalSeconds":900,"graceHours":72}'::jsonb, true, 'License heartbeat cadence and offline grace period'),
  ('ui','accent','{"color":"#2680eb"}'::jsonb, true, 'Default accent colour pushed to all panels'),
  ('premium','locked_modules','{"modules":["toolkit.ffx","command.stream","cache.cloudSync"]}'::jsonb, true, 'Modules that require an active license');