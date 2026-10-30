CREATE TABLE IF NOT EXISTS public.usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_key text NOT NULL,
  license_id uuid NULL,
  plan text NULL,
  metric text NOT NULL,
  period text NOT NULL,
  used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope_key, metric, period)
);

CREATE INDEX IF NOT EXISTS usage_counters_period_metric_idx ON public.usage_counters (period, metric);
CREATE INDEX IF NOT EXISTS usage_counters_license_idx ON public.usage_counters (license_id, period);

GRANT ALL ON public.usage_counters TO service_role;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.ghost_consume_quota(
  p_scope text,
  p_license uuid,
  p_plan text,
  p_metric text,
  p_period text,
  p_amount integer,
  p_limit integer
) RETURNS TABLE (allowed boolean, used integer, limit_value integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used integer;
  v_amount integer := GREATEST(COALESCE(p_amount, 1), 0);
BEGIN
  INSERT INTO public.usage_counters (scope_key, license_id, plan, metric, period, used)
  VALUES (p_scope, p_license, p_plan, p_metric, p_period, 0)
  ON CONFLICT (scope_key, metric, period) DO UPDATE
    SET license_id = COALESCE(EXCLUDED.license_id, public.usage_counters.license_id),
        plan = COALESCE(EXCLUDED.plan, public.usage_counters.plan)
  RETURNING public.usage_counters.used INTO v_used;

  IF p_limit IS NOT NULL AND v_used + v_amount > p_limit THEN
    RETURN QUERY SELECT false, v_used, p_limit;
    RETURN;
  END IF;

  UPDATE public.usage_counters
     SET used = public.usage_counters.used + v_amount,
         updated_at = now()
   WHERE scope_key = p_scope AND metric = p_metric AND period = p_period
  RETURNING public.usage_counters.used INTO v_used;

  RETURN QUERY SELECT true, v_used, p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.ghost_consume_quota(text, uuid, text, text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ghost_consume_quota(text, uuid, text, text, text, integer, integer) TO service_role;