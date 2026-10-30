CREATE TABLE public.relay_devices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), device_uuid text UNIQUE NOT NULL,
 device_name text NOT NULL, token_hash text NOT NULL, status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED','REVOKED')),
 heartbeat_seconds integer NOT NULL DEFAULT 300, last_seen_at timestamptz, app_version text, android_version text, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.relay_devices TO authenticated;
GRANT ALL ON public.relay_devices TO service_role;
ALTER TABLE public.relay_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY relay_devices_admin_read ON public.relay_devices FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.relay_pairing_codes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code_hash text UNIQUE NOT NULL, expires_at timestamptz NOT NULL,
 used_at timestamptz, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.relay_pairing_codes TO authenticated;
GRANT ALL ON public.relay_pairing_codes TO service_role;
ALTER TABLE public.relay_pairing_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY relay_codes_admin_read ON public.relay_pairing_codes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.relay_pair_attempts (
 scope_hash text NOT NULL, window_start timestamptz NOT NULL, attempts integer NOT NULL DEFAULT 1,
 PRIMARY KEY(scope_hash, window_start)
);
GRANT ALL ON public.relay_pair_attempts TO service_role;
ALTER TABLE public.relay_pair_attempts ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.relay_allow_pair_attempt(p_scope_hash text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer; w timestamptz := date_trunc('minute', now());
BEGIN
 DELETE FROM public.relay_pair_attempts WHERE scope_hash = p_scope_hash AND window_start < w - interval '1 hour';
 INSERT INTO public.relay_pair_attempts(scope_hash, window_start) VALUES(p_scope_hash, w)
 ON CONFLICT(scope_hash, window_start) DO UPDATE SET attempts = public.relay_pair_attempts.attempts + 1 RETURNING attempts INTO n;
 RETURN n <= 5;
END; $$;
REVOKE ALL ON FUNCTION public.relay_allow_pair_attempt(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.relay_allow_pair_attempt(text) TO service_role;
CREATE FUNCTION public.relay_pair_device(p_code_hash text, p_device_uuid text, p_device_name text, p_token_hash text, p_app_version text, p_android_version text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c uuid; d uuid;
BEGIN
 SELECT id INTO c FROM public.relay_pairing_codes WHERE code_hash = p_code_hash AND used_at IS NULL AND expires_at > now() FOR UPDATE;
 IF c IS NULL THEN RETURN NULL; END IF;
 INSERT INTO public.relay_devices(device_uuid,device_name,token_hash,app_version,android_version,last_seen_at)
 VALUES(p_device_uuid,p_device_name,p_token_hash,p_app_version,p_android_version,now()) ON CONFLICT(device_uuid) DO NOTHING RETURNING id INTO d;
 IF d IS NULL THEN RETURN NULL; END IF;
 UPDATE public.relay_pairing_codes SET used_at = now() WHERE id = c;
 RETURN d;
END; $$;
REVOKE ALL ON FUNCTION public.relay_pair_device(text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.relay_pair_device(text,text,text,text,text,text) TO service_role;
COMMENT ON TABLE public.relay_devices IS 'Testing-only Android relay pairing; does not activate payments or licences.';