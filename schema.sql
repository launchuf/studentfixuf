-- Studentfix — full schema for a fresh Supabase project.
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- It is NOT idempotent (CREATE TYPE / CREATE TABLE will fail if they already
-- exist), so only run it against an empty project or drop the objects first.

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  image_key text NOT NULL DEFAULT 'overall',
  description text NOT NULL DEFAULT '',
  badge text,
  sold integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products" ON public.products
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  school text,
  address text,
  zip text,
  city text,
  payment_method text NOT NULL DEFAULT 'kort',
  status text NOT NULL DEFAULT 'väntande',
  subtotal integer NOT NULL DEFAULT 0,
  shipping integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  image_key text NOT NULL DEFAULT 'overall',
  unit_price integer NOT NULL DEFAULT 0,
  qty integer NOT NULL DEFAULT 1
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- Seed products
INSERT INTO public.products (name, category, price, stock, active, image_key, description, badge, sold) VALUES
('Signature Overall — Vit','Overaller',649,42,true,'overall','Premium studentoverall i tjock bomullstwill med guldbroderat SF på bröstet. Kraftig dragkedja, förstärkta knän och sömmar som håller hela studenttiden.','Bästsäljare',312),
('Signature Overall — Svart','Overaller',699,7,true,'overall','Samma snitt som originalet, i djupsvart. För den som vill äga hela gården.','Limited',128),
('Spray Trio — Violett / Elektrisk / Guld','Sprayflaskor',249,120,true,'spray','Tre matta textilsprayer med hög täckning: Ultra Violet, Ocean Blue och Golden Hour. Torkar på 10 minuter och tål tvätt.','Nyhet',540),
('Spray Enkel — Guldglans','Sprayflaskor',99,3,true,'spray','Guldspray med metallisk finish. 400 ml.',NULL,210),
('Mallkit — Siffror 0–9','Mallar',149,64,true,'stencil','Återanvändbara schabloner i slitstark PET. Alla siffror 0–9 i 12 cm höjd. Torka av och kör igen.',NULL,188),
('Mallkit — Initialer A–Ö','Mallar',199,0,false,'stencil','Hela alfabetet inklusive Å, Ä, Ö. Perfekt för namn och klasskoder.',NULL,96),
('Personligt Studentband — Lila','Studentband',179,85,true,'band','Satinband i djuplila med ditt namn och årtal broderat i guld. Levereras i presentask.','Personlig',402),
('Personligt Studentband — Svart/Guld','Studentband',179,5,true,'band','Svart satin med guldbrodyr. Namn, årtal och valfri text på baksidan.',NULL,233);
