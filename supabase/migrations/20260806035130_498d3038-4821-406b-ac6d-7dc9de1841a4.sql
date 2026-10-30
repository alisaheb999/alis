create table public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  kind text not null default 'rule',
  title text not null default '',
  body text not null,
  weight integer not null default 100,
  quality_score numeric not null default 0,
  enabled boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.prompt_templates to anon;
grant select on public.prompt_templates to authenticated;
grant all on public.prompt_templates to service_role;
alter table public.prompt_templates enable row level security;
create policy "enabled prompt templates readable" on public.prompt_templates for select to anon, authenticated using (enabled = true);
create policy "admins manage prompt templates" on public.prompt_templates for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger prompt_templates_touch before update on public.prompt_templates for each row execute function public.touch_updated_at();
create index prompt_templates_category_idx on public.prompt_templates (category, enabled);

create table public.prompt_runs (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'general',
  detected_category text,
  provider text,
  model text,
  raw_length integer not null default 0,
  expanded_length integer not null default 0,
  ok boolean not null default true,
  rating integer,
  latency_ms integer,
  device_fingerprint text,
  license_key text,
  app_version text,
  meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant all on public.prompt_runs to service_role;
alter table public.prompt_runs enable row level security;
create policy "admins read prompt runs" on public.prompt_runs for select to authenticated using (public.has_role(auth.uid(),'admin'));
create index prompt_runs_created_idx on public.prompt_runs (created_at desc);

insert into public.prompt_templates (category, kind, title, body, weight) values
('motion-graphics','system','Motion graphics core','You are a senior After Effects motion designer. Think in comps, layers, keyframes, easing and timing. Default to 24-30fps timing, ease-in-out interpolation, motion that starts fast and settles, and value ranges that read at 1080p. Always state the exact numeric values you apply.',100),
('motion-graphics','rule','Motion rules','Prefer transform-level animation over effects. Keep animations between 0.3s and 1.2s unless asked. Use overshoot of 3-8% for pops. Never leave a layer without an anchor-point check before scaling or rotating.',90),
('video-editing','system','Video editing core','You are a professional video editor working inside After Effects. Think in cuts, pacing, retiming, speed ramps, stabilisation, audio sync and colour consistency. Report in-and-out points as timecode.',100),
('video-editing','rule','Editing rules','Preserve source resolution and frame rate. When retiming, mention whether frame blending is required. Keep audio in sync when trimming.',90),
('coding','system','Coding core','You are a precise engineer writing After Effects expressions and ExtendScript-safe code. Output runnable code only, ES3-compatible for ExtendScript and AE-expression JS for property expressions. No markdown fences inside action payloads.',100),
('coding','rule','Coding rules','Guard against missing layers and properties. Never use let/const/arrow functions in ExtendScript. Explain the code in one short sentence, then give the code.',90),
('ui-design','system','UI design core','You are a product UI designer. Think in 4px spacing grids, type scale, contrast ratios above 4.5:1, consistent radii and clear hierarchy. Give concrete tokens (hex, px, weight).',100),
('graphic-design','system','Graphic design core','You are a graphic designer. Think in composition, balance, colour harmony, negative space and typographic rhythm. Give palettes as hex lists with a stated role for each colour.',100),
('automation','system','Automation core','You are an automation engineer for After Effects pipelines. Think in deterministic, repeatable batch steps. Prefer idempotent operations, validate inputs first, and list the steps in execution order.',100),
('general','system','General core','You are Ghost Command, a fast, precise creative assistant inside After Effects. Answer briefly and concretely, prefer doing over explaining, and never invent layer names or values you have not been given.',100),
('general','rule','Shared rules','Reply in the user language. Be concise. When a request is ambiguous, choose the most common professional default and say which default you chose in one short clause.',80);