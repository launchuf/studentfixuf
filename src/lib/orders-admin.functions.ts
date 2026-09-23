import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { imageFor, type ImageKey } from "@/lib/products";
import type { Order, OrderStatus } from "@/lib/orders";

/** Hämtar alla ordrar med orderrader för adminpanelen. */
export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<Order[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id,order_no,customer_name,customer_email,school,address,city,payment_method,status,total,created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    if (!orders || orders.length === 0) return [];

    const { data: items, error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .select("order_id,product_name,image_key,unit_price,qty,product_id")
      .in(
        "order_id",
        orders.map((o) => o.id),
      );
    if (itemsErr) throw new Error(itemsErr.message);

    return orders.map((o) => ({
      id: o.order_no,
      customer: { name: o.customer_name, email: o.customer_email, ...(o.school ? { school: o.school } : {}) },
      lines: (items ?? [])
        .filter((i) => i.order_id === o.id)
        .map((i) => ({
          product: {
            id: i.product_id ?? "",
            name: i.product_name,
            category: "Overaller" as const,
            price: i.unit_price,
            stock: 0,
            active: true,
            imageKey: (i.image_key ?? "overall") as ImageKey,
            image: imageFor(i.image_key ?? "overall"),
            description: "",
            sold: 0,
          },
          qty: i.qty,
        })),
      total: o.total,
      status: o.status as OrderStatus,
      date: o.created_at,
      ...(o.address ? { shipping: { address: o.address, city: o.city ?? "", method: o.payment_method } } : {}),
    }));
  });

export const setOrderStatusAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({ orderNo: z.string().min(1), status: z.enum(["betald", "väntande", "avbruten"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").update({ status: data.status }).eq("order_no", data.orderNo);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
