import type { Product } from "./products";

export type OrderStatus = "betald" | "väntande" | "avbruten";

export type OrderLine = { product: Product; qty: number };

export type Order = {
  id: string;
  customer: { name: string; email: string; school?: string };
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  date: string; // ISO
  shipping?: { address: string; city: string; method: string };
};

export function salesLast30(orders: Order[]) {
  const end = Date.now();
  const days: { day: string; total: number; orders: number }[] = [];
  for (let d = 29; d >= 0; d--) {
    const start = end - d * 86400000;
    const label = new Date(start).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
    const dayOrders = orders.filter((o) => {
      const t = new Date(o.date).getTime();
      return o.status === "betald" && t >= start - 86400000 && t < start;
    });
    days.push({ day: label, total: dayOrders.reduce((s, o) => s + o.total, 0), orders: dayOrders.length });
  }
  return days;
}
