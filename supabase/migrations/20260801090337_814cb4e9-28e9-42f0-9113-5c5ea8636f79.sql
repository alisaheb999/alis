CREATE TABLE public.vault_assets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  kind TEXT NOT NULL DEFAULT 'other',
  tags TEXT[] NOT NULL DEFAULT '{}',
  file_name TEXT NOT NULL DEFAULT '',
  mime_type TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  preview_url TEXT,
  source_created_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX vault_assets_category_idx ON public.vault_assets (category);
CREATE INDEX vault_assets_kind_idx ON public.vault_assets (kind);

GRANT SELECT ON public.vault_assets TO anon;
GRANT SELECT ON public.vault_assets TO authenticated;
GRANT ALL ON public.vault_assets TO service_role;

ALTER TABLE public.vault_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vault catalogue is publicly readable"
  ON public.vault_assets FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.vault_sync_state (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  cursor_offset INTEGER NOT NULL DEFAULT 0,
  expected_total INTEGER NOT NULL DEFAULT 0,
  budget_day DATE NOT NULL DEFAULT CURRENT_DATE,
  budget_used INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vault_sync_state_singleton CHECK (id = 1)
);

GRANT ALL ON public.vault_sync_state TO service_role;

ALTER TABLE public.vault_sync_state ENABLE ROW LEVEL SECURITY;

INSERT INTO public.vault_sync_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;