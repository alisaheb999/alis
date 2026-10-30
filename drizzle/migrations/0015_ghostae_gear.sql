CREATE TABLE public.gear_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gear_categories TO authenticated;
GRANT ALL ON public.gear_categories TO service_role;
ALTER TABLE public.gear_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage gear categories" ON public.gear_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.gear_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category_id uuid REFERENCES public.gear_categories(id) ON DELETE SET NULL,
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  compatibility text NOT NULL DEFAULT '',
  box_contents jsonb NOT NULL DEFAULT '[]'::jsonb,
  delivery_info text NOT NULL DEFAULT '',
  warranty_info text NOT NULL DEFAULT '',
  return_info text NOT NULL DEFAULT '',
  image_paths text[] NOT NULL DEFAULT '{}',
  related_slugs text[] NOT NULL DEFAULT '{}',
  source_url text,
  source_price_bdt integer,
  procurement_cost_bdt integer,
  extra_cost_bdt integer,
  sale_price_bdt integer,
  compare_price_bdt integer,
  stock_status text NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock','low_stock','out_of_stock','preorder')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','unpublished')),
  sort_order integer NOT NULL DEFAULT 100,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gear_products TO authenticated;
GRANT ALL ON public.gear_products TO service_role;
ALTER TABLE public.gear_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage gear products" ON public.gear_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER gear_products_touch BEFORE UPDATE ON public.gear_products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.gear_categories (slug, name, sort_order) VALUES
  ('hubs','Hubs & Adapters',10),('card-readers','Card Readers',20),('desk','Desk Setup',30);

INSERT INTO public.gear_products (slug, name, category_id, short_description, description, features, compatibility, source_url, source_price_bdt, sort_order) VALUES
 ('usb-c-6-in-1-hub','6-in-1 USB-C Hub',(SELECT id FROM public.gear_categories WHERE slug='hubs'),
  'ল্যাপটপে বাড়তি পোর্ট: HDMI, USB, SD/TF ও PD।',
  'যেসব ভিডিও এডিটরের ল্যাপটপে পোর্ট কম, তাদের জন্য একটি USB-C হাব।',
  '["USB-C সংযোগ","HDMI আউটপুট","USB পোর্ট","SD/TF কার্ড রিডার","Power Delivery সাপোর্ট"]'::jsonb,
  'USB-C পোর্টযুক্ত ল্যাপটপ (মডেল যাচাই সাপেক্ষে)',
  'https://www.daraz.com.bd/products/-i530422677.html',2394,10),
 ('4-port-usb-hub','4-Port USB Hub',(SELECT id FROM public.gear_categories WHERE slug='hubs'),
  'কিবোর্ড, মাউস ও USB ড্রাইভ একসঙ্গে যুক্ত করুন।',
  'একটি USB পোর্ট থেকে একাধিক পেরিফেরাল ব্যবহারের জন্য।',
  '["একাধিক USB ডিভাইস সংযোগ"]'::jsonb,'',
  'https://www.daraz.com.bd/tag/computer-hubs/',228,20),
 ('usb-c-card-reader','USB-C SD/TF Card Reader',(SELECT id FROM public.gear_categories WHERE slug='card-readers'),
  'ক্যামেরার ফুটেজ দ্রুত কম্পিউটারে নিন।',
  'সমর্থিত SD/TF কার্ড থেকে ফাইল ট্রান্সফারের জন্য।',
  '["SD/TF কার্ড থেকে ফাইল ট্রান্সফার"]'::jsonb,'',
  'https://www.daraz.com.bd/tag/hub-usb-to-c/',80,30),
 ('foldable-laptop-stand','Adjustable Foldable Laptop Stand',(SELECT id FROM public.gear_categories WHERE slug='desk'),
  'ল্যাপটপ উঁচু রেখে আরামদায়ক ডেস্ক সেটআপ।',
  'দীর্ঘ সময় ডেস্কে কাজ করা ভিডিও এডিটর ও মোশন ডিজাইনারদের জন্য।',
  '["ল্যাপটপ উঁচু করে রাখা","কাজের জায়গা গোছানো","ভাঁজ করে বহনযোগ্য"]'::jsonb,'',
  'https://www.zipper.com.bd/pc-accessories',520,40);