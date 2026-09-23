import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, MapPin, Truck, Mail, School } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/lib/admin-store";
import type { Order, OrderStatus } from "@/lib/orders";
import { formatSEK } from "@/lib/products";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/bestallningar")({
  component: OrdersPage,
});

const STATUSES: (OrderStatus | "alla")[] = ["alla", "betald", "väntande", "avbruten"];

function OrdersPage() {
  const { orders, setOrderStatus } = useAdminStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrderStatus | "alla">("alla");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return orders.filter(
      (o) => (status === "alla" || o.status === status) && (o.id.toLowerCase().includes(s) || o.customer.email.toLowerCase().includes(s) || o.customer.name.toLowerCase().includes(s)),
    );
  }, [orders, q, status]);

  const open = orders.find((o) => o.id === openId) ?? null;
  const counts = { alla: orders.length, betald: 0, väntande: 0, avbruten: 0 } as Record<string, number>;
  orders.forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Beställningar</h1>
        <p className="text-muted-foreground">{orders.length} ordrar totalt</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sök order-ID eller e-post…" className="h-9 w-72 rounded-lg border-border bg-card pl-9" />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors", status === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {s} <span className="rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface hover:bg-surface">
              <TableHead>Order</TableHead>
              <TableHead>Kund</TableHead>
              <TableHead>Produkter</TableHead>
              <TableHead>Totalt</TableHead>
              <TableHead>Betalning</TableHead>
              <TableHead className="text-right">Datum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((o) => (
              <TableRow key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer border-border">
                <TableCell className="font-mono text-xs font-semibold">{o.id}</TableCell>
                <TableCell>
                  <p className="font-medium">{o.customer.name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer.email}</p>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {o.lines.slice(0, 3).map((l) => (
                      <img key={l.product.id} src={l.product.image} alt="" width={1024} height={1024} loading="lazy" className="h-8 w-8 rounded-md border-2 border-card object-cover" />
                    ))}
                    <span className="ml-3 self-center pl-2 text-xs text-muted-foreground">{o.lines.reduce((s, l) => s + l.qty, 0)} st</span>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">{formatSEK(o.total)}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
                <TableCell className="text-right text-muted-foreground">{new Date(o.date).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}</TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Inga ordrar matchar.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <OrderSheet order={open} onClose={() => setOpenId(null)} onStatus={(s) => { if (open) { setOrderStatus(open.id, s); toast.success(`Order ${open.id} markerad som ${s}`); } }} />
    </div>
  );
}

function OrderSheet({ order, onClose, onStatus }: { order: Order | null; onClose: () => void; onStatus: (s: OrderStatus) => void }) {
  return (
    <Sheet open={!!order} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full border-border bg-card sm:max-w-lg overflow-y-auto">
        {order && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3 font-display text-xl">
                <span className="font-mono">{order.id}</span>
                <StatusBadge status={order.status} />
              </SheetTitle>
              <p className="text-xs text-muted-foreground">{new Date(order.date).toLocaleString("sv-SE")}</p>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-6">
              <section className="rounded-xl border border-border bg-surface p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Kund</p>
                <p className="mt-2 font-semibold">{order.customer.name}</p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {order.customer.email}</p>
                {order.customer.school && <p className="flex items-center gap-2 text-sm text-muted-foreground"><School className="h-3.5 w-3.5" /> {order.customer.school}</p>}
              </section>

              <section>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Produkter</p>
                <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
                  {order.lines.map((l) => (
                    <li key={l.product.id} className="flex items-center gap-3 p-3">
                      <img src={l.product.image} alt="" width={1024} height={1024} loading="lazy" className="h-12 w-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="font-medium">{l.product.name}</p>
                        <p className="text-xs text-muted-foreground">{l.qty} × {formatSEK(l.product.price)}</p>
                      </div>
                      <span className="font-semibold">{formatSEK(l.qty * l.product.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between px-1">
                  <span className="text-muted-foreground">Totalt</span>
                  <span className="font-display text-2xl font-bold">{formatSEK(order.total)}</span>
                </div>
              </section>

              {order.shipping && (
                <section className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Leverans</p>
                  <p className="mt-2 flex items-center gap-2 text-sm"><Truck className="h-3.5 w-3.5 text-electric" /> {order.shipping.method}</p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {order.shipping.address}, {order.shipping.city}</p>
                </section>
              )}

              <section>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Ändra status</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["betald", "väntande", "avbruten"] as OrderStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => onStatus(s)}
                      className={cn("rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors", order.status === s ? "border-gold bg-gold/10 text-gold" : "border-border hover:bg-secondary")}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
