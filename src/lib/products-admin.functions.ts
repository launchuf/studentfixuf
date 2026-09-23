import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { toProduct, type ProductRow } from "@/lib/products";

/** Hämtar alla produkter (inkl. inaktiva) för adminpanelen. */
export const listAllProducts = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id,name,category,price,stock,active,image_key,description,badge,sold")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ProductRow[]).map(toProduct);
  });

const productInput = z.object({
  name: z.string().min(1).max(120),
  category: z.enum(["Overaller", "Sprayflaskor", "Mallar", "Studentband"]),
  price: z.number().int().min(0),
  stock: z.number().int().min(0),
  active: z.boolean(),
  imageKey: z.enum(["overall", "spray", "stencil", "band"]),
  description: z.string().max(2000),
  badge: z.string().max(60).nullable().optional(),
});

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => productInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert({
        name: data.name,
        category: data.category,
        price: data.price,
        stock: data.stock,
        active: data.active,
        image_key: data.imageKey,
        description: data.description,
        badge: data.badge ?? null,
      })
      .select("id,name,category,price,stock,active,image_key,description,badge,sold")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Kunde inte skapa produkten.");
    return toProduct(row as ProductRow);
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), patch: productInput.partial() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.patch.name !== undefined) patch["name"] = data.patch.name;
    if (data.patch.category !== undefined) patch["category"] = data.patch.category;
    if (data.patch.price !== undefined) patch["price"] = data.patch.price;
    if (data.patch.stock !== undefined) patch["stock"] = data.patch.stock;
    if (data.patch.active !== undefined) patch["active"] = data.patch.active;
    if (data.patch.imageKey !== undefined) patch["image_key"] = data.patch.imageKey;
    if (data.patch.description !== undefined) patch["description"] = data.patch.description;
    if (data.patch.badge !== undefined) patch["badge"] = data.patch.badge;

    const { data: row, error } = await supabaseAdmin
      .from("products")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", data.id)
      .select("id,name,category,price,stock,active,image_key,description,badge,sold")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Kunde inte uppdatera produkten.");
    return toProduct(row as ProductRow);
  });

export const deleteProducts = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
