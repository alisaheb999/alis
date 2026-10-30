-- Ghost Caption job queue (browser-worker pipeline)

CREATE TABLE public.caption_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'ghost-caption-worker',
  status TEXT NOT NULL DEFAULT 'idle',
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  max_jobs INT NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.caption_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_key TEXT,
  device_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  stage TEXT NOT NULL DEFAULT 'queued',
  progress INT NOT NULL DEFAULT 0,
  media_object_key TEXT NOT NULL,
  media_name TEXT NOT NULL DEFAULT 'media',
  media_mime TEXT NOT NULL DEFAULT 'application/octet-stream',
  media_size BIGINT NOT NULL DEFAULT 0,
  duration_hint NUMERIC,
  language TEXT,
  idempotency_key TEXT,
  worker_id UUID REFERENCES public.caption_workers(id) ON DELETE SET NULL,
  lease_expires_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  result_srt TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '2 days'
);

CREATE INDEX caption_jobs_queue_idx ON public.caption_jobs (status, created_at);
CREATE UNIQUE INDEX caption_jobs_idempotency_idx ON public.caption_jobs (idempotency_key) WHERE idempotency_key IS NOT NULL;

GRANT ALL ON public.caption_jobs TO service_role;
GRANT ALL ON public.caption_workers TO service_role;

ALTER TABLE public.caption_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caption_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view caption jobs" ON public.caption_jobs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view caption workers" ON public.caption_workers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_caption_jobs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER caption_jobs_updated_at BEFORE UPDATE ON public.caption_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_caption_jobs();

-- Transactional claim: requeue expired leases, then lease exactly one queued job.
CREATE OR REPLACE FUNCTION public.claim_caption_job(_worker_id UUID, _lease_seconds INT DEFAULT 900)
RETURNS public.caption_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed public.caption_jobs;
BEGIN
  UPDATE public.caption_jobs
     SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'queued' END,
         stage = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'queued' END,
         error_code = CASE WHEN attempts >= max_attempts THEN 'lease_expired' ELSE error_code END,
         error_message = CASE WHEN attempts >= max_attempts THEN 'Worker lease expired too many times.' ELSE error_message END,
         worker_id = NULL,
         lease_expires_at = NULL
   WHERE status = 'processing' AND lease_expires_at IS NOT NULL AND lease_expires_at < now();

  UPDATE public.caption_jobs AS j
     SET status = 'processing',
         stage = 'claimed',
         progress = GREATEST(j.progress, 5),
         worker_id = _worker_id,
         attempts = j.attempts + 1,
         lease_expires_at = now() + make_interval(secs => GREATEST(60, _lease_seconds))
   WHERE j.id = (
     SELECT id FROM public.caption_jobs
      WHERE status = 'queued' AND expires_at > now()
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
   )
   RETURNING j.* INTO claimed;

  RETURN claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_caption_job(UUID, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_caption_job(UUID, INT) FROM anon;
REVOKE ALL ON FUNCTION public.claim_caption_job(UUID, INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_caption_job(UUID, INT) TO service_role;