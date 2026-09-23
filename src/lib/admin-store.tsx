import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Product } from "./products";
import type { Order, OrderStatus } from "./orders";
import { listAllProducts, createProduct, updateProduct as updateProductFn, deleteProducts } from "./products-admin.functions";
import { listOrders, setOrderStatusAdmin } from "./orders-admin.functions";

type Store = {
  products: Product[];
  orders: Order[];
  loading: boolean;
  addProduct: (p: Omit<Product, "id" | "sold">) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProducts: (ids: string[]) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
};

const Ctx = createContext<Store | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const productsQ = useQuery({ queryKey: ["admin", "products"], queryFn: () => listAllProducts() });
  const ordersQ = useQuery({ queryKey: ["admin", "orders"], queryFn: () => listOrders() });

  const invalidateProducts = () => qc.invalidateQueries({ queryKey: ["admin", "products"] });

  const addMut = useMutation({
    mutationFn: (p: Omit<Product, "id" | "sold">) =>
      createProduct({
        data: {
          name: p.name,
          category: p.category,
          price: p.price,
          stock: p.stock,
          active: p.active,
          imageKey: p.imageKey ?? "overall",
          description: p.description,
          badge: p.badge ?? null,
        },
      }),
    onSuccess: invalidateProducts,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte spara produkten."),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Product> }) =>
      updateProductFn({
        data: {
          id,
          patch: {
            ...(patch.name !== undefined && { name: patch.name }),
            ...(patch.category !== undefined && { category: patch.category }),
            ...(patch.price !== undefined && { price: patch.price }),
            ...(patch.stock !== undefined && { stock: patch.stock }),
            ...(patch.active !== undefined && { active: patch.active }),
            ...(patch.imageKey !== undefined && { imageKey: patch.imageKey }),
            ...(patch.description !== undefined && { description: patch.description }),
            ...(patch.badge !== undefined && { badge: patch.badge }),
          },
        },
      }),
    onSuccess: invalidateProducts,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte uppdatera produkten."),
  });

  const removeMut = useMutation({
    mutationFn: (ids: string[]) => deleteProducts({ data: { ids } }),
    onSuccess: invalidateProducts,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte ta bort produkterna."),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      setOrderStatusAdmin({ data: { orderNo: id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte uppdatera ordern."),
  });

  const value = useMemo<Store>(
    () => ({
      products: productsQ.data ?? [],
      orders: ordersQ.data ?? [],
      loading: productsQ.isLoading || ordersQ.isLoading,
      addProduct: (p) => addMut.mutate(p),
      updateProduct: (id, patch) => updateMut.mutate({ id, patch }),
      removeProducts: (ids) => removeMut.mutate(ids),
      setOrderStatus: (id, status) => statusMut.mutate({ id, status }),
    }),
    [productsQ.data, ordersQ.data, productsQ.isLoading, ordersQ.isLoading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdminStore outside provider");
  return c;
}
