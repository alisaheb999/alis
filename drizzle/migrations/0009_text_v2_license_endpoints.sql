CREATE TABLE public.license_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid,
  license_key text,
  machine_id text,
  action text NOT NULL,
  result text NOT NULL,
  error_code text,
  ip_address text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.license_logs TO service_role;
ALTER TABLE public.license_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX license_logs_license_idx ON public.license_logs(license_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.text_activate_license(p_key text, p_machine text, p_device_name text, p_app_version text, p_os_info text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l public.licenses; a public.license_activations; n integer;
BEGIN
  SELECT * INTO l FROM public.licenses WHERE license_key = p_key FOR UPDATE;
  IF l.id IS NULL THEN RETURN jsonb_build_object('ok',false,'code','not_found'); END IF;
  IF l.status <> 'active' THEN RETURN jsonb_build_object('ok',false,'code','license_'||l.status::text,'license_id',l.id); END IF;
  IF l.expires_at IS NOT NULL AND l.expires_at <= now() THEN RETURN jsonb_build_object('ok',false,'code','license_expired','license_id',l.id); END IF;
  SELECT * INTO a FROM public.license_activations WHERE license_id = l.id AND device_fingerprint = p_machine;
  IF a.id IS NOT NULL AND a.revoked THEN RETURN jsonb_build_object('ok',false,'code','device_revoked','license_id',l.id); END IF;
  IF a.id IS NULL THEN
    SELECT count(*) INTO n FROM public.license_activations WHERE license_id = l.id AND NOT revoked;
    IF n >= l.max_activations THEN RETURN jsonb_build_object('ok',false,'code','device_limit','license_id',l.id,'max',l.max_activations); END IF;
    INSERT INTO public.license_activations(license_id, device_fingerprint, hostname, platform, app_version, revoked, last_seen_at)
    VALUES (l.id, p_machine, left(p_device_name,120), left(p_os_info,120), left(p_app_version,40), false, now());
  ELSE
    UPDATE public.license_activations SET hostname = left(p_device_name,120), platform = left(p_os_info,120), app_version = left(p_app_version,40), last_seen_at = now() WHERE id = a.id;
  END IF;
  SELECT count(*) INTO n FROM public.license_activations WHERE license_id = l.id AND NOT revoked;
  UPDATE public.licenses SET activation_count = n, last_seen_at = now(), activated_at = COALESCE(activated_at, now()) WHERE id = l.id;
  RETURN jsonb_build_object('ok',true,'license_id',l.id,'devices',n,'max',l.max_activations);
END; $$;

CREATE OR REPLACE FUNCTION public.text_deactivate_license(p_license uuid, p_machine text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer; d integer;
BEGIN
  PERFORM 1 FROM public.licenses WHERE id = p_license FOR UPDATE;
  DELETE FROM public.license_activations WHERE license_id = p_license AND device_fingerprint = p_machine AND NOT revoked;
  GET DIAGNOSTICS d = ROW_COUNT;
  SELECT count(*) INTO n FROM public.license_activations WHERE license_id = p_license AND NOT revoked;
  UPDATE public.licenses SET activation_count = n WHERE id = p_license;
  RETURN d > 0;
END; $$;

REVOKE ALL ON FUNCTION public.text_activate_license(text,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.text_deactivate_license(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.text_activate_license(text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.text_deactivate_license(uuid,text) TO service_role;