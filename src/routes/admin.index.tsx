import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminStore } from "@/lib/admin-store";
import { salesLast30 } from "@/lib/orders";
import { formatSEK } from "@/lib/products";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/admin/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Admin Dashboard | Studentfix",
      },
    ],
  }),
});

function Dashboard() {
  const { orders, products } = useAdminStore();

  const paid = orders.filter((o) => o.status === "betald");

  const now = new Date("2027-04-20T12:00:00Z").getTime();

  const inDays = (o: { date: string }, d: number) =>
    now - new Date(o.date).getTime() < d * 86400000;

  const allTime = paid.reduce((s, o) => s + o.total, 0);

  const month = paid
    .filter((o) => inDays(o, 30))
    .reduce((s, o) => s + o.total, 0);

  const ordersWeek = orders.filter((o) => inDays(o, 7)).length;
  const ordersMonth = orders.filter((o) => inDays(o, 30)).length;

  const aov = paid.length ? Math.round(allTime / paid.length) : 0;

  const series = salesLast30(orders);

  const top = [...products]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const low = products.filter((p) => p.stock <= 8);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Översikt</h1>
          <p className="text-muted-foreground">
            God morgon, Zilan. Här är läget idag.
          </p>
        </div>

        <span className="text-xs text-muted-foreground">
          Uppdaterad nyss
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Intäkter denna månad"
          value={formatSEK(month)}
          delta="+18,4 %"
          icon={TrendingUp}
          accent="violet"
        />

        <Kpi
          label="Intäkter totalt"
          value={formatSEK(allTime)}
          delta="Alla tider"
          icon={Receipt}
          accent="gold"
        />

        <Kpi
          label="Beställningar"
          value={`${ordersMonth}`}
          delta={`${ordersWeek} denna vecka`}
          icon={ShoppingCart}
          accent="electric"
        />

        <Kpi
          label="Snittordervärde"
          value={formatSEK(aov)}
          delta="+6,2 %"
          icon={TrendingUp}
          accent="violet"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card
          title="Försäljning senaste 30 dagarna"
          action={
            <span className="text-xs text-muted-foreground">
              Endast betalda
            </span>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={series}
                margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="sales"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--violet)"
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--electric)"
                      stopOpacity={0}
                    />
                  </linearGradient>

                  <linearGradient
                    id="stroke"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="var(--violet)" />
                    <stop offset="60%" stopColor="var(--electric)" />
                    <stop offset="100%" stopColor="var(--gold)" />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="day"
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />

                <YAxis
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />

                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{
                    color: "var(--muted-foreground)",
                  }}
                  formatter={(v: number) => [formatSEK(v), "Försäljning"]}
                />

                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="url(#stroke)"
                  strokeWidth={2.5}
                  fill="url(#sales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Bästsäljare"
          action={
            <Link
              to="/admin/produkter"
              className="text-xs text-gold hover:underline"
            >
              Alla produkter
            </Link>
          }
        >
          <ul className="space-y-3">
            {top.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="w-4 font-display text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>

                <img
                  src={p.image}
                  alt=""
                  width={1024}
                  height={1024}
                  loading="lazy"
                  className="h-9 w-9 rounded-md object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>

                  <div className="mt-1 h-1 rounded-full bg-muted">
                    <div
                      className="h-1 rounded-full bg-brand-gradient"
                      style={{
                        width: `${
                          (p.sold / (top[0]?.sold ?? 1)) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <span className="text-xs font-semibold">{p.sold} st</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card
          title="Senaste beställningarna"
          action={
            <Link
              to="/admin/bestallningar"
              className="flex items-center gap-1 text-xs text-gold hover:underline"
            >
              Visa alla
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Order</TableHead>
                <TableHead>Kund</TableHead>
                <TableHead>Belopp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Datum</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {orders.slice(0, 7).map((o) => (
                <TableRow key={o.id} className="border-border">
                  <TableCell className="font-mono text-xs">
                    {o.id}
                  </TableCell>

                  <TableCell>
                    <p className="font-medium">{o.customer.name}</p>

                    <p className="text-xs text-muted-foreground">
                      {o.customer.email}
                    </p>
                  </TableCell>

                  <TableCell className="font-semibold">
                    {formatSEK(o.total)}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>

                  <TableCell className="text-right text-muted-foreground">
                    {new Date(o.date).toLocaleDateString("sv-SE")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card
          title="Lågt lager"
          action={
            <span className="flex items-center gap-1 text-xs text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              {low.length} varningar
            </span>
          }
        >
          <ul className="space-y-2">
            {low.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>

                  <p className="text-xs text-muted-foreground">
                    {p.category}
                  </p>
                </div>

                <span
                  className={`font-display text-lg font-bold ${
                    p.stock === 0 ? "text-destructive" : "text-warning"
                  }`}
                >
                  {p.stock}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  icon: typeof TrendingUp;
  accent: "violet" | "gold" | "electric";
}) {
  const ring = {
    violet: "from-violet/30",
    gold: "from-gold/30",
    electric: "from-electric/30",
  }[accent];

  const text = {
    violet: "text-violet",
    gold: "text-gold",
    electric: "text-electric",
  }[accent];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${ring} to-transparent blur-2xl`}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>

        <Icon className={`h-4 w-4 ${text}`} />
      </div>

      <p className="mt-3 font-display text-3xl font-bold tracking-tight">
        {value}
      </p>

      <p className={`mt-1 text-xs font-semibold ${text}`}>{delta}</p>
    </div>
  );
}
