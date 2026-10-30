CREATE TABLE public.giveaway_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'স্পিন করে উপহার জিতুন',
  active boolean NOT NULL DEFAULT false,
  spins_per_user integer NOT NULL DEFAULT 3 CHECK (spins_per_user BETWEEN 1 AND 10),
  prizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  rules text NOT NULL DEFAULT '',
  win_message text NOT NULL DEFAULT '',
  claim_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.giveaway_campaigns TO service_role;
ALTER TABLE public.giveaway_campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.giveaway_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.giveaway_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  email text,
  prize_label text NOT NULL,
  is_win boolean NOT NULL DEFAULT false,
  claim_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX giveaway_spins_user_idx ON public.giveaway_spins(campaign_id, user_id);
GRANT ALL ON public.giveaway_spins TO service_role;
ALTER TABLE public.giveaway_spins ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER giveaway_campaigns_touch BEFORE UPDATE ON public.giveaway_campaigns
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.giveaway_spin(p_user uuid, p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.giveaway_campaigns; used int; total numeric; r numeric; acc numeric := 0;
  p jsonb; idx int := 0; pick jsonb; pick_idx int := 0; code text; win boolean;
BEGIN
  SELECT * INTO c FROM giveaway_campaigns WHERE active ORDER BY updated_at DESC LIMIT 1 FOR UPDATE;
  IF c.id IS NULL THEN RETURN jsonb_build_object('error','inactive'); END IF;
  PERFORM pg_advisory_xact_lock(hashtext(c.id::text || p_user::text));
  SELECT count(*) INTO used FROM giveaway_spins WHERE campaign_id = c.id AND user_id = p_user;
  IF used >= c.spins_per_user THEN RETURN jsonb_build_object('error','limit','left',0); END IF;
  SELECT coalesce(sum(greatest((e->>'weight')::numeric,0)),0) INTO total FROM jsonb_array_elements(c.prizes) e;
  IF total <= 0 THEN RETURN jsonb_build_object('error','no_prizes'); END IF;
  r := random() * total;
  FOR p IN SELECT * FROM jsonb_array_elements(c.prizes) LOOP
    acc := acc + greatest((p->>'weight')::numeric,0);
    IF pick IS NULL AND r < acc THEN pick := p; pick_idx := idx; END IF;
    idx := idx + 1;
  END LOOP;
  IF pick IS NULL THEN pick := c.prizes->(idx-1); pick_idx := idx-1; END IF;
  win := coalesce((pick->>'win')::boolean, false);
  IF win THEN code := 'GA-' || upper(substr(md5(gen_random_uuid()::text),1,8)); END IF;
  INSERT INTO giveaway_spins(campaign_id,user_id,email,prize_label,is_win,claim_code)
  VALUES (c.id,p_user,p_email,coalesce(pick->>'label','?'),win,code);
  RETURN jsonb_build_object('index',pick_idx,'label',pick->>'label','win',win,'code',code,'left',c.spins_per_user-used-1);
END $$;
REVOKE ALL ON FUNCTION public.giveaway_spin(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.giveaway_spin(uuid,text) TO service_role;

INSERT INTO public.giveaway_campaigns (title, active, spins_per_user, prizes, rules, win_message)
VALUES ('স্পিন করে উপহার জিতুন', false, 3,
 '[{"label":"Gemini 18 মাস","weight":5,"win":true},{"label":"আবার চেষ্টা করুন","weight":40,"win":false},{"label":"ধন্যবাদ!","weight":30,"win":false},{"label":"পরের বার","weight":25,"win":false}]'::jsonb,
 'প্রতি অ্যাকাউন্টে ৩ বার স্পিন।
জিতলে কোডটি WhatsApp-এ পাঠান।
একজন একবারই উপহার নিতে পারবেন।',
 'অভিনন্দন! কোডটি কপি করে আমাদের WhatsApp-এ পাঠান।');