CREATE TABLE public.dev_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project text NOT NULL,
  note text,
  file_path text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.dev_snapshots TO service_role;
ALTER TABLE public.dev_snapshots ENABLE ROW LEVEL SECURITY;
CREATE INDEX dev_snapshots_project_idx ON public.dev_snapshots(project, created_at DESC);