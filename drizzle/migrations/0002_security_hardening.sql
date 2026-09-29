-- Studentfix security hardening
-- Applies to an existing database after migrations 0000 and 0001.

-- 1) Admin role checks: never trust a caller-supplied user id.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;

-- Rebuild policies around the non-spoofable one-argument helper.
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Admins can read orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can read order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;

CREATE POLICY "Public can read active products" ON public.products
  FOR SELECT TO anon, authenticated
  USING (active OR public.has_role('admin'));
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role('admin'));
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated
  USING (public.has_role('admin'));

CREATE POLICY "Admins can read orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role('admin'));
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

CREATE POLICY "Admins can read order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.has_role('admin'));

CREATE POLICY "Admins can manage contact messages" ON public.contact_messages
  FOR ALL TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

CREATE POLICY "Public can read images for active products" ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND (p.active OR public.has_role('admin'))
    )
  );
CREATE POLICY "Admins can insert product images" ON public.product_images
  FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
CREATE POLICY "Admins can update product images" ON public.product_images
  FOR UPDATE TO authenticated USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));
CREATE POLICY "Admins can delete product images" ON public.product_images
  FOR DELETE TO authenticated USING (public.has_role('admin'));

-- 2) Atomic stock reservations. Product stock remains the physical stock count;
-- active reservations reduce available stock for checkout without permanently
-- decrementing stock until payment is confirmed. Reservations expire after 24h.
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

CREATE INDEX IF NOT EXISTS idx_stock_reservations_product_active
  ON public.stock_reservations(product_id, expires_at)
  WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stock_reservations_order
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
  SELECT status
  INTO order_status
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
    SELECT 1
    FROM public.stock_reservations
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
