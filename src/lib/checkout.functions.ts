import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const lineSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  origin: z.string().url(),
  customer: z.object({
    name: z.string().min(1).max(120),
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

function orderNo() {
  return `SF-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(Math.random() * 90 + 10)}`;
}

/** Skapar ordern i databasen och startar betalningen (Stripe Checkout om nyckel finns). */
export const startCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => checkoutSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = data.items.map((i) => i.productId);
    const { data: rows, error } = await supabaseAdmin
      .from("products")
      .select("id,name,price,image_key,active")
      .in("id", ids);
    if (error) throw new Error(error.message);

    const lines = data.items
      .map((i) => {
        const p = rows?.find((r) => r.id === i.productId);
        return p && p.active ? { ...i, product: p } : null;
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);
    if (lines.length === 0) throw new Error("Inga giltiga produkter i varukorgen.");

    const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
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
    if (orderErr || !order) throw new Error(orderErr?.message ?? "Kunde inte skapa order.");

    await supabaseAdmin.from("order_items").insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.product.id,
        product_name: l.product.name,
        image_key: l.product.image_key,
        unit_price: l.product.price,
        qty: l.qty,
      })),
    );

    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (stripeKey) {
      const body = new URLSearchParams();
      body.set("mode", "payment");
      body.set("customer_email", data.customer.email);
      body.set("success_url", `${data.origin}/betalning/lyckad?order=${no}&session_id={CHECKOUT_SESSION_ID}`);
      body.set("cancel_url", `${data.origin}/betalning/misslyckad?order=${no}`);
      body.set("client_reference_id", no);
      lines.forEach((l, i) => {
        body.set(`line_items[${i}][quantity]`, String(l.qty));
        body.set(`line_items[${i}][price_data][currency]`, "sek");
        body.set(`line_items[${i}][price_data][unit_amount]`, String(l.product.price * 100));
        body.set(`line_items[${i}][price_data][product_data][name]`, l.product.name);
      });
      if (shipping > 0) {
        const i = lines.length;
        body.set(`line_items[${i}][quantity]`, "1");
        body.set(`line_items[${i}][price_data][currency]`, "sek");
        body.set(`line_items[${i}][price_data][unit_amount]`, String(shipping * 100));
        body.set(`line_items[${i}][price_data][product_data][name]`, "Frakt");
      }

      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const session = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
      if (!res.ok || !session.url) {
        await supabaseAdmin.from("orders").update({ status: "avbruten" }).eq("id", order.id);
        throw new Error(session.error?.message ?? "Betalningen kunde inte startas.");
      }
      await supabaseAdmin.from("orders").update({ stripe_session_id: session.id ?? null }).eq("id", order.id);
      return { orderNo: no, url: session.url, mode: "stripe" as const, total };
    }

    // Demo-läge: ingen Stripe-nyckel konfigurerad ännu.
    return {
      orderNo: no,
      url: `/betalning/behandlar?order=${no}`,
      mode: "demo" as const,
      total,
    };
  });

/** Bekräftar betalningen och uppdaterar orderstatus. */
export const confirmPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ orderNo: z.string().min(3).max(40), sessionId: z.string().max(200).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,order_no,total,status,customer_name,customer_email,stripe_session_id")
      .eq("order_no", data.orderNo)
      .maybeSingle();
    if (!order) return { status: "saknas" as const, order: null };

    let paid = order.status === "betald";
    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!paid && stripeKey && order.stripe_session_id) {
      const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order.stripe_session_id}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      const session = (await res.json()) as { payment_status?: string };
      paid = session.payment_status === "paid";
    } else if (!paid && !stripeKey) {
      paid = true; // demo-läge
    }

    if (paid && order.status !== "betald") {
      await supabaseAdmin.from("orders").update({ status: "betald" }).eq("id", order.id);
    }

    return {
      status: (paid ? "betald" : "väntande") as "betald" | "väntande",
      order: { orderNo: order.order_no, total: order.total, name: order.customer_name, email: order.customer_email },
    };
  });

/** Markerar en order som avbruten (avbruten/nekad betalning). */
export const cancelOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ orderNo: z.string().min(3).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,order_no,total,status")
      .eq("order_no", data.orderNo)
      .maybeSingle();
    if (!order) return { ok: false, total: 0 };
    if (order.status !== "betald") {
      await supabaseAdmin.from("orders").update({ status: "avbruten" }).eq("id", order.id);
    }
    return { ok: true, total: order.total };
  });
