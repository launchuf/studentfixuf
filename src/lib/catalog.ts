import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toProduct, type Product, type ProductRow } from "./products";

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,category,price,stock,active,image_key,description,badge,sold")
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const { data: imageRows } = await supabase
    .from("product_images" as any)
    .select("product_id,url,position")
    .order("position", { ascending: true });
  // product_images table may not exist yet — gracefully return empty array

  const byProduct = new Map<string, { id: string; url: string }[]>();
  ((imageRows as unknown) as { product_id: string; url: string }[]).forEach((r, idx) => {
    const arr = byProduct.get(r.product_id) ?? [];
    arr.push({ id: String(idx), url: r.url });
    byProduct.set(r.product_id, arr);
  });

  return (data as ProductRow[]).map((row) => toProduct(row, byProduct.get(row.id) ?? []));
}

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: fetchProducts, staleTime: 30_000 });
}
