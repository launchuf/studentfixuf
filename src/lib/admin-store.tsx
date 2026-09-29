import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { imageFor, toProduct, type ImageKey, type Product, type ProductRow } from "./products";
import type { Order, OrderStatus } from "./orders";

type Store = {
  products: Product[];
  orders: Order[];
  loading: boolean;
  addProduct: (p: Omit<Product, "id" | "sold" | "images" | "image">, files: File[]) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  saveProductImages: (id: string, files: File[], removeImageIds: string[]) => Promise<void>;
  removeProducts: (ids: string[]) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
};

const Ctx = createContext<Store | null>(null);

type OrderRow = {
  id: string;
  order_no: string;
  customer_name: string;
  customer_email: string;
  school: string | null;
  address: string | null;
  zip: string | null;
  city: string | null;
  payment_method: string;
  status: string;
  total: number;
  created_at: string;
  order_items: { product_id: string | null; product_name: string; image_key: string; unit_price: number; qty: number }[];
};

type ProductImageRow = { id: string; product_id: string; url: string; position: number };

async function fetchAdminProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,category,price,stock,active,image_key,description,badge,sold")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const { data: imageRows } = await supabase
    .from("product_images" as any)
    .select("id,product_id,url,position")
    .order("position", { ascending: true });
  // product_images table may not exist yet — gracefully return empty array

  const byProduct = new Map<string, { id: string; url: string }[]>();
  ((imageRows as unknown) as ProductImageRow[]).forEach((r) => {
    const arr = byProduct.get(r.product_id) ?? [];
    arr.push({ id: r.id, url: r.url });
    byProduct.set(r.product_id, arr);
  });

  return (data as ProductRow[]).map((row) => toProduct(row, byProduct.get(row.id) ?? []));
}

async function fetchAdminOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_no,customer_name,customer_email,school,address,zip,city,payment_method,status,total,created_at,order_items(product_id,product_name,image_key,unit_price,qty)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as OrderRow[]).map((o) => ({
    id: o.order_no,
    customer: { name: o.customer_name, email: o.customer_email, ...(o.school ? { school: o.school } : {}) },
    lines: o.order_items.map((it, i) => ({
      qty: it.qty,
      product: {
        id: it.product_id ?? `${o.id}-${i}`,
        name: it.product_name,
        category: "Overaller",
        price: it.unit_price,
        stock: 0,
        active: true,
        imageKey: it.image_key as ImageKey,
        image: imageFor(it.image_key),
        images: [],
        description: "",
        sold: 0,
      },
    })),
    total: o.total,
    status: (["betald", "väntande", "avbruten"].includes(o.status) ? o.status : "väntande") as OrderStatus,
    date: o.created_at,
    shipping: o.address
      ? { address: o.address, city: [o.zip, o.city].filter(Boolean).join(" "), method: o.payment_method === "swish" ? "Swish" : "Kort" }
      : undefined,
  }));
}

function toRow(p: Partial<Product>) {
  const r: { [k: string]: unknown } = {};
  if (p.name !== undefined) r["name"] = p.name;
  if (p.category !== undefined) r["category"] = p.category;
  if (p.price !== undefined) r["price"] = p.price;
  if (p.stock !== undefined) r["stock"] = p.stock;
  if (p.active !== undefined) r["active"] = p.active;
  if (p.imageKey !== undefined) r["image_key"] = p.imageKey;
  if (p.description !== undefined) r["description"] = p.description;
  if (p.badge !== undefined) r["badge"] = p.badge;
  return r;
}

async function uploadImages(productId: string, files: File[], startPosition: number) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${productId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    const { error: insErr } = await supabase
      .from("product_images" as any)
      .insert({ product_id: productId, url: pub.publicUrl, position: startPosition + i });
    if (insErr) throw insErr;
  }
}

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const productsQ = useQuery({ queryKey: ["admin", "products"], queryFn: fetchAdminProducts });
  const ordersQ = useQuery({ queryKey: ["admin", "orders"], queryFn: fetchAdminOrders });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };
  const onError = (e: Error) => toast.error(`Något gick fel: ${e.message}`);

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Product> }) => {
      const { error } = await supabase.from("products").update(toRow(patch) as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError,
  });
  const status = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("order_no", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError,
  });

  async function addProduct(p: Omit<Product, "id" | "sold" | "images" | "image">, files: File[]) {
    try {
      const { data, error } = await supabase.from("products").insert(toRow(p) as never).select("id").single();
      if (error || !data) throw error ?? new Error("Kunde inte skapa produkten.");
      if (files.length > 0) await uploadImages((data as { id: string }).id, files, 0);
      refresh();
    } catch (e) {
      onError(e instanceof Error ? e : new Error("Okänt fel"));
      throw e;
    }
  }

  async function saveProductImages(id: string, files: File[], removeImageIds: string[]) {
    try {
      if (removeImageIds.length > 0) {
        const { error } = await supabase.from("product_images" as any).delete().in("id", removeImageIds);
        if (error) throw error;
      }
      if (files.length > 0) {
        const { count } = await supabase
          .from("product_images" as any)
          .select("id", { count: "exact", head: true })
          .eq("product_id", id);
        await uploadImages(id, files, count ?? 0);
      }
      refresh();
    } catch (e) {
      onError(e instanceof Error ? e : new Error("Okänt fel"));
      throw e;
    }
  }

  const value = useMemo<Store>(
    () => ({
      products: productsQ.data ?? [],
      orders: ordersQ.data ?? [],
      loading: productsQ.isLoading || ordersQ.isLoading,
      addProduct,
      updateProduct: (id, patch) => update.mutate({ id, patch }),
      saveProductImages,
      removeProducts: (ids) => remove.mutate(ids),
      setOrderStatus: (id, s) => status.mutate({ id, status: s }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productsQ.data, ordersQ.data, productsQ.isLoading, ordersQ.isLoading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdminStore outside provider");
  return c;
}
