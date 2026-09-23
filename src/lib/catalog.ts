import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toProduct, type Product, type ProductRow } from "./products";

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,category,price,stock,active,image_key,description,badge,sold")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ProductRow[]).map(toProduct);
}

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: fetchProducts, staleTime: 30_000 });
}
