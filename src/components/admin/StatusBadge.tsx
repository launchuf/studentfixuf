import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/orders";

const map: Record<OrderStatus, string> = {
  betald: "bg-success/15 text-success border-success/30",
  väntande: "bg-warning/15 text-warning border-warning/30",
  avbruten: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize", map[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        active ? "bg-electric/15 text-electric border-electric/30" : "bg-muted text-muted-foreground border-border",
      )}
    >
      {active ? "Aktiv" : "Dold"}
    </span>
  );
}
