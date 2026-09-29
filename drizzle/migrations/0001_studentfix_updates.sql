-- Kör hela denna fil i Supabase → SQL Editor → New query → Run

-- 1) Ta bort exempelprodukterna
DELETE FROM public.products WHERE name IN (
  'Signature Overall — Vit',
  'Signature Overall — Svart',
  'Spray Trio — Violett / Elektrisk / Guld',
  'Spray Enkel — Guldglans',
  'Mallkit — Siffror 0–9',
  'Mallkit — Initialer A–Ö',
  'Personligt Studentband — Lila',
  'Personligt Studentband — Svart/Guld'
);

-- 2) Byt gamla "Mallar"-kategorin till "Flaggor" om nåt skulle finnas kvar
UPDATE public.products SET category = 'Flaggor', image_key = 'flag' WHERE category = 'Mallar';

-- 3) Tabell för flera bilder per produkt (riktiga uppladdade filer)
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product images" ON public.product_images
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert product images" ON public.product_images
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product images" ON public.product_images
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product images" ON public.product_images
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_product_images_product ON public.product_images(product_id, position);

-- 4) Storage-bucket för uppladdade produktbilder
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view product images in storage" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images to storage" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product images from storage" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
