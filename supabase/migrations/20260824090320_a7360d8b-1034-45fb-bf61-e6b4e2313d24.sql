CREATE TABLE public.download_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package text NOT NULL,
  item text,
  tier text NOT NULL DEFAULT 'free',
  license_fingerprint text,
  panel_version text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.download_events TO service_role;
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX download_events_package_idx ON public.download_events (package, created_at DESC);
CREATE INDEX download_events_fingerprint_idx ON public.download_events (license_fingerprint);

CREATE VIEW public.download_totals
WITH (security_invoker = true) AS
SELECT package, count(*)::bigint AS downloads, max(created_at) AS last_download_at
FROM public.download_events
GROUP BY package;

CREATE VIEW public.download_daily
WITH (security_invoker = true) AS
SELECT (created_at AT TIME ZONE 'UTC')::date AS day, package, count(*)::bigint AS downloads
FROM public.download_events
GROUP BY 1, 2;

GRANT SELECT ON public.download_totals TO service_role;
GRANT SELECT ON public.download_daily TO service_role;