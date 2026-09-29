-- Studentfix — full schema for a fresh Supabase project.
-- Run this ONCE in Supabase SQL Editor (Project → SQL Editor → New query).
-- Only run on an empty project — not idempotent.

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

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated;

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

CREATE POLICY "Public can read active products" ON public.products
  FOR SELECT TO anon, authenticated USING (active OR public.has_role('admin'));
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role('admin'));
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role('admin'));

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
  FOR SELECT TO authenticated USING (public.has_role('admin'));
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role('admin'));

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
  FOR SELECT TO authenticated USING (public.has_role('admin'));

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

-- Contact form messages (from /kontakt)
CREATE TABLE public.contact_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  subject     text,
  message     text NOT NULL,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can read/delete contact messages
CREATE POLICY "Admins can manage contact messages"
  ON public.contact_messages
  FOR ALL
  USING (public.has_role('admin'));

-- Allow inserts from anyone (the contact form)
CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Product images (multi-image support per product)
-- Also create a Supabase Storage bucket called "product-images" (public) via the dashboard.
CREATE TABLE IF NOT EXISTS public.product_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         text NOT NULL,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read images for active products"
  ON public.product_images FOR SELECT TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND (p.active OR public.has_role('admin'))
    )
  );

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (public.has_role('admin'));


-- Atomic stock reservations and payment finalization are defined in migration 0002.


-- Stock reservations for safe checkout concurrency
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  qty integer NOT NULL CHECK (qty > 0),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  released_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_reservations_product_active
  ON public.stock_reservations(product_id, expires_at)
  WHERE released_at IS NULL;
CREATE INDEX idx_stock_reservations_order
  ON public.stock_reservations(order_id);

ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.stock_reservations TO service_role;
REVOKE ALL ON public.stock_reservations FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.reserve_checkout_stock(
  p_order_id uuid,
  p_items jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item record;
  current_stock integer;
  reserved_qty integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND status = 'väntande') THEN
    RAISE EXCEPTION 'Ordern finns inte eller kan inte reservera lager.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.stock_reservations WHERE order_id = p_order_id AND released_at IS NULL) THEN
    RAISE EXCEPTION 'Lager är redan reserverat för ordern.';
  END IF;

  FOR item IN
    SELECT (value->>'productId')::uuid AS product_id,
           SUM((value->>'qty')::integer)::integer AS qty
    FROM jsonb_array_elements(p_items)
    GROUP BY (value->>'productId')::uuid
  LOOP
    SELECT stock INTO current_stock
    FROM public.products
    WHERE id = item.product_id
      AND active
    FOR UPDATE;

    IF current_stock IS NULL THEN
      RAISE EXCEPTION 'Produkten är inte längre tillgänglig.';
    END IF;

    UPDATE public.stock_reservations
    SET released_at = COALESCE(released_at, now())
    WHERE product_id = item.product_id
      AND released_at IS NULL
      AND expires_at <= now();

    SELECT COALESCE(SUM(qty), 0)
    INTO reserved_qty
    FROM public.stock_reservations
    WHERE product_id = item.product_id
      AND released_at IS NULL
      AND expires_at > now();

    IF current_stock - reserved_qty < item.qty THEN
      RAISE EXCEPTION 'Slut i lager för produkten.';
    END IF;

    INSERT INTO public.stock_reservations (order_id, product_id, qty)
    VALUES (p_order_id, item.product_id, item.qty);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_checkout_stock(p_order_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.stock_reservations
  SET released_at = COALESCE(released_at, now())
  WHERE order_id = p_order_id
    AND released_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.complete_paid_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_status text;
  item record;
  current_stock integer;
BEGIN
  SELECT status INTO order_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF order_status IS NULL THEN
    RAISE EXCEPTION 'Ordern finns inte.';
  END IF;

  IF order_status = 'betald' THEN
    RETURN;
  END IF;

  IF order_status <> 'väntande' THEN
    RAISE EXCEPTION 'Ordern kan inte markeras som betald.';
  END IF;

  FOR item IN
    SELECT product_id, SUM(qty)::integer AS qty
    FROM public.stock_reservations
    WHERE order_id = p_order_id
      AND released_at IS NULL
      AND finalized_at IS NULL
      AND expires_at > now()
    GROUP BY product_id
  LOOP
    SELECT stock INTO current_stock
    FROM public.products
    WHERE id = item.product_id
    FOR UPDATE;

    IF current_stock IS NULL OR current_stock < item.qty THEN
      RAISE EXCEPTION 'Lager räcker inte för att slutföra ordern.';
    END IF;

    UPDATE public.products
    SET stock = stock - item.qty,
        sold = sold + item.qty
    WHERE id = item.product_id;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM public.stock_reservations
    WHERE order_id = p_order_id
      AND released_at IS NULL
      AND finalized_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Ingen aktiv lagerreservation finns för ordern.';
  END IF;

  UPDATE public.stock_reservations
  SET released_at = now(),
      finalized_at = now()
  WHERE order_id = p_order_id
    AND released_at IS NULL
    AND finalized_at IS NULL;

  UPDATE public.orders
  SET status = 'betald'
  WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_checkout_stock(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_checkout_stock(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_paid_order(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_checkout_stock(uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_checkout_stock(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_paid_order(uuid) TO service_role;
