import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerEnv } from "@/lib/env.server";

const lineSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().email(),
    phone: z.string().max(40).optional().default(""),
    school: z.string().max(120).optional().default(""),
    address: z.string().max(160).optional().default(""),
    zip: z.string().max(20).optional().default(""),
    city: z.string().max(80).optional().default(""),
  }),
  paymentMethod: z.enum(["kort", "swish"]),
  items: z.array(lineSchema).min(1).max(40),
});

const confirmSchema = z.object({
  orderNo: z.string().min(3).max(40),
  sessionId: z.string().min(10).max(200),
});

const siteOrigin = (() => {
  const configured = getServerEnv("PUBLIC_SITE_URL") ?? "https://studentfixuf.se";
  const parsed = new URL(configured);

  if (parsed.protocol !== "https:" || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("PUBLIC_SITE_URL must be an HTTPS origin without a path, query, or hash.");
  }

  return parsed.origin;
})();

function orderNo() {
  return `SF-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

async function cancelAndReleaseOrder(
  supabaseAdmin: typeof import("@/integrations/supabase/client.server").supabaseAdmin,
  orderId: string,
) {
  await supabaseAdmin.rpc("release_checkout_stock", { p_order_id: orderId });
  await supabaseAdmin
    .from("orders")
    .update({ status: "avbruten" })
    .eq("id", orderId)
    .neq("status", "betald");
}

/**
 * Creates the order in Supabase and starts Stripe Checkout.
 */
export const startCheckout = createServerFn({ method: "POST" })
  .validator((d: unknown) => checkoutSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");

    const quantities = new Map<string, number>();
    for (const item of data.items) {
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.qty);
    }

    const ids = [...quantities.keys()];
    const { data: rows, error } = await supabaseAdmin
      .from("products")
      .select("id,name,price,image_key,active,category")
      .in("id", ids);

    if (error) {
      throw new Error(error.message);
    }

    const productsById = new Map((rows ?? []).map((row) => [row.id, row]));
    const lines = ids.map((productId) => {
      const product = productsById.get(productId);
      const qty = quantities.get(productId) ?? 0;

      return product && product.active ? { product, productId, qty } : null;
    });

    if (lines.some((line) => line === null)) {
      throw new Error("En eller flera produkter är inte längre tillgängliga.");
    }

    const validLines = lines.filter(
      (line): line is NonNullable<typeof line> => line !== null,
    );

    // Klassrabatt: after the first 25 overalls, each additional overall is 10 kr cheaper.
    const OVERALL_BULK_THRESHOLD = 25;
    const OVERALL_BULK_DISCOUNT = 10;

    const overallQty = validLines
      .filter((line) => line.product.category === "Overaller")
      .reduce((sum, line) => sum + line.qty, 0);

    const overallDiscountUnits = Math.max(0, overallQty - OVERALL_BULK_THRESHOLD);
    const bulkDiscount = overallDiscountUnits * OVERALL_BULK_DISCOUNT;

    const rawSubtotal = validLines.reduce(
      (sum, line) => sum + line.product.price * line.qty,
      0,
    );

    const subtotal = rawSubtotal - bulkDiscount;
    // Keep server pricing identical to the checkout UI.
    const shipping = subtotal >= 800 ? 0 : 59;
    const total = subtotal + shipping;
    const no = orderNo();

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_no: no,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_phone: data.customer.phone,
        school: data.customer.school,
        address: data.customer.address,
        zip: data.customer.zip,
        city: data.customer.city,
        payment_method: data.paymentMethod,
        status: "väntande",
        subtotal,
        shipping,
        total,
      })
      .select("id,order_no")
      .single();

    if (orderErr || !order) {
      throw new Error(orderErr?.message ?? "Kunde inte skapa order.");
    }

    const reservationItems = validLines.map((line) => ({
      productId: line.product.id,
      qty: line.qty,
    }));

    const { error: reserveError } = await supabaseAdmin.rpc(
      "reserve_checkout_stock",
      {
        p_order_id: order.id,
        p_items: reservationItems,
      },
    );

    if (reserveError) {
      await cancelAndReleaseOrder(supabaseAdmin, order.id);
      throw new Error(reserveError.message);
    }

    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(
        validLines.map((line) => ({
          order_id: order.id,
          product_id: line.product.id,
          product_name: line.product.name,
          image_key: line.product.image_key,
          unit_price: line.product.price,
          qty: line.qty,
        })),
      );

    if (itemsErr) {
      await cancelAndReleaseOrder(supabaseAdmin, order.id);
      throw new Error(itemsErr.message);
    }

    const stripeKey = getServerEnv("STRIPE_SECRET_KEY");

    if (!stripeKey) {
      await cancelAndReleaseOrder(supabaseAdmin, order.id);
      throw new Error(
        "Stripe är inte konfigurerat på servern. STRIPE_SECRET_KEY saknas.",
      );
    }

    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("customer_email", data.customer.email);
    body.set(
      "success_url",
      `${siteOrigin}/betalning/lyckad?order=${encodeURIComponent(no)}&session_id={CHECKOUT_SESSION_ID}`,
    );
    body.set(
      "cancel_url",
      `${siteOrigin}/betalning/misslyckad?order=${encodeURIComponent(no)}`,
    );
    body.set("client_reference_id", no);

    const stripeSubtotal = Math.round(subtotal * 100);
    const stripeShipping = Math.round(shipping * 100);
    const orderLabel =
      bulkDiscount > 0
        ? `Beställning ${no} (klassrabatt inräknad)`
        : `Beställning ${no}`;

    body.set("line_items[0][quantity]", "1");
    body.set("line_items[0][price_data][currency]", "sek");
    body.set("line_items[0][price_data][unit_amount]", String(stripeSubtotal));
    body.set("line_items[0][price_data][product_data][name]", orderLabel);
    body.set(
      "line_items[0][price_data][product_data][description]",
      validLines
        .map((line) => `${line.qty}x ${line.product.name}`)
        .join(", ")
        .slice(0, 500),
    );

    if (shipping > 0) {
      body.set("line_items[1][quantity]", "1");
      body.set("line_items[1][price_data][currency]", "sek");
      body.set("line_items[1][price_data][unit_amount]", String(stripeShipping));
      body.set("line_items[1][price_data][product_data][name]", "Frakt");
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const session = (await response.json()) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };

    if (!response.ok || !session.id || !session.url) {
      await cancelAndReleaseOrder(supabaseAdmin, order.id);
      throw new Error(session.error?.message ?? "Betalningen kunde inte startas.");
    }

    const { error: sessionUpdateError } = await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id)
      .eq("status", "väntande");

    if (sessionUpdateError) {
      try {
        await fetch(
          `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session.id)}/expire`,
          { headers: { Authorization: `Bearer ${stripeKey}` }, method: "POST" },
        );
      } catch {
        // Best effort: checkout was not returned to the client.
      }

      await cancelAndReleaseOrder(supabaseAdmin, order.id);
      throw new Error("Kunde inte spara betalningssessionen. Försök igen.");
    }

    return {
      orderNo: no,
      url: session.url,
      mode: "stripe" as const,
      total,
    };
  });

/**
 * Confirms the Stripe payment and updates the order status.
 * The Stripe session ID is a capability token: without it no customer data is returned.
 */
export const confirmPayment = createServerFn({ method: "POST" })
  .validator((d: unknown) => confirmSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "id,order_no,total,status,customer_name,customer_email,stripe_session_id",
      )
      .eq("order_no", data.orderNo)
      .maybeSingle();

    if (!order || !order.stripe_session_id || order.stripe_session_id !== data.sessionId) {
      return {
        status: "saknas" as const,
        order: null,
      };
    }

    let paid = order.status === "betald";

    if (!paid) {
      const stripeKey = getServerEnv("STRIPE_SECRET_KEY");
      if (!stripeKey) {
        throw new Error(
          "Stripe är inte konfigurerat på servern. STRIPE_SECRET_KEY saknas.",
        );
      }

      const response = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(data.sessionId)}`,
        { headers: { Authorization: `Bearer ${stripeKey}` } },
      );

      const session = (await response.json()) as {
        id?: string;
        payment_status?: string;
        status?: string;
        client_reference_id?: string | null;
        amount_total?: number | null;
        currency?: string | null;
      };

      paid =
        response.ok &&
        session.id === data.sessionId &&
        session.status === "complete" &&
        session.payment_status === "paid" &&
        session.client_reference_id === order.order_no &&
        session.amount_total === order.total * 100 &&
        session.currency?.toLowerCase() === "sek";
    }

    if (!paid) {
      return {
        status: "väntande" as const,
        order: null,
      };
    }

    if (order.status !== "betald") {
      const { error: finalizeError } = await supabaseAdmin.rpc(
        "complete_paid_order",
        { p_order_id: order.id },
      );

      if (finalizeError) {
        throw new Error(
          "Betalningen är bekräftad men lagersaldot kunde inte slutföras säkert. Kontakta oss om problemet kvarstår.",
        );
      }
    }

    return {
      status: "betald" as const,
      order: {
        orderNo: order.order_no,
        total: order.total,
        name: order.customer_name,
        email: order.customer_email,
      },
    };
  });
