CREATE TABLE public.giveaway_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 campaign_id uuid NOT NULL REFERENCES public.giveaway_campaigns(id),
 visitor_id uuid NOT NULL,
 prize_label text NOT NULL,
 is_win boolean NOT NULL,
 claim_code text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.giveaway_entries TO service_role;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;
CREATE INDEX giveaway_entries_visitor_campaign ON public.giveaway_entries(campaign_id, visitor_id);
COMMENT ON TABLE public.giveaway_entries IS 'Anonymous browser participation; privileged server access only. Existing authenticated giveaway_spins remain preserved.';
CREATE OR REPLACE FUNCTION public.giveaway_enter(p_visitor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.giveaway_campaigns; used int; total numeric; r numeric; acc numeric := 0; p jsonb; pick jsonb; code text; win boolean;
BEGIN
 IF p_visitor IS NULL THEN RETURN jsonb_build_object('error','identity'); END IF;
 SELECT * INTO c FROM public.giveaway_campaigns WHERE active ORDER BY updated_at DESC LIMIT 1 FOR UPDATE;
 IF c.id IS NULL THEN RETURN jsonb_build_object('error','inactive'); END IF;
 PERFORM pg_advisory_xact_lock(hashtext(c.id::text || p_visitor::text));
 SELECT count(*) INTO used FROM public.giveaway_entries WHERE campaign_id=c.id AND visitor_id=p_visitor;
 IF used >= c.spins_per_user THEN RETURN jsonb_build_object('error','limit','left',0); END IF;
 SELECT coalesce(sum(greatest((e->>'weight')::numeric,0)),0) INTO total FROM jsonb_array_elements(c.prizes) e;
 IF total <= 0 THEN RETURN jsonb_build_object('error','no_prizes'); END IF;
 r := random()*total;
 FOR p IN SELECT * FROM jsonb_array_elements(c.prizes) LOOP
  acc := acc + greatest((p->>'weight')::numeric,0);
  IF pick IS NULL AND r < acc THEN pick := p; END IF;
 END LOOP;
 IF pick IS NULL THEN RETURN jsonb_build_object('error','no_prizes'); END IF;
 win := coalesce((pick->>'win')::boolean,false);
 IF win THEN code := 'GA-' || upper(replace(gen_random_uuid()::text,'-','')); END IF;
 INSERT INTO public.giveaway_entries(campaign_id,visitor_id,prize_label,is_win,claim_code) VALUES(c.id,p_visitor,pick->>'label',win,code);
 RETURN jsonb_build_object('label',pick->>'label','win',win,'code',code,'left',c.spins_per_user-used-1);
END;
$$;
REVOKE ALL ON FUNCTION public.giveaway_enter(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.giveaway_enter(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.published_giveaway() RETURNS TABLE(id uuid,title text,spins_per_user integer,rules text,prize_labels jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT c.id,c.title,c.spins_per_user,c.rules,(SELECT jsonb_agg(p->>'label') FROM jsonb_array_elements(c.prizes) p)
 FROM public.giveaway_campaigns c WHERE c.active ORDER BY c.updated_at DESC LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.published_giveaway() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.published_giveaway() TO anon, authenticated, service_role;