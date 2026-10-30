create table if not exists public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null unique,
  name_en text not null,
  name_bn text not null default '',
  price_monthly integer not null default 0,
  price_yearly integer not null default 0,
  currency text not null default 'BDT',
  tokens_monthly integer not null default 0,
  device_limit integer not null default 1,
  badge text,
  description_en text not null default '',
  description_bn text not null default '',
  sort_order integer not null default 100,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant all on public.pricing_plans to service_role;
alter table public.pricing_plans enable row level security;
create policy "pricing_plans_public_read" on public.pricing_plans for select to anon, authenticated using (visible = true);
grant select on public.pricing_plans to anon, authenticated;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  email text,
  customer_name text,
  plan text not null default 'pro',
  amount integer not null default 0,
  currency text not null default 'BDT',
  method text not null default 'bkash',
  provider_ref text,
  status text not null default 'pending',
  license_key text,
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant all on public.payments to service_role;
alter table public.payments enable row level security;

create trigger pricing_plans_touch before update on public.pricing_plans
  for each row execute function public.touch_updated_at();
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

insert into public.pricing_plans (plan_key, name_en, name_bn, price_monthly, price_yearly, tokens_monthly, device_limit, badge, description_en, sort_order)
values
  ('free','Free','ফ্রি',0,0,300,1,null,'Basic AI and starter downloads for learning the workflow.',10),
  ('pro','Premium','প্রিমিয়াম',399,3999,500,2,'Most popular','Advanced multi-model AI with full cloud access.',20),
  ('ultra','Ultra','আলট্রা',999,9999,3000,3,null,'Professional AI engine with the full asset and template library.',30),
  ('team','Team','টিম',1999,19999,10000,5,null,'Shared studio pool with central licence management.',40)
on conflict (plan_key) do nothing;