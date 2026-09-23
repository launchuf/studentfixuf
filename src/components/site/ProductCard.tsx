import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatSEK, type Product } from "@/lib/products";
import { useTilt } from "./Reveal";

export function ProductCard({ product }: { product: Product }) {
  const { add, setOpen } = useCart();
  const tilt = useTilt(7);
  const out = product.stock === 0;

  return (
    <div
      {...tilt}
      className="tilt-card group relative overflow-hidden rounded-3xl border border-border bg-card shadow-card"
      style={{ ["--mx" as string]: "50%", ["--my" as string]: "50%" }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(400px circle at var(--mx) var(--my), color-mix(in oklab, var(--violet) 22%, transparent), transparent 60%)",
        }}
      />
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          width={1024}
          height={1024}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {product.badge && (
          <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-foreground">
            {product.badge}
          </span>
        )}
        {out && (
          <span className="absolute right-4 top-4 rounded-full bg-background/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur">
            Slutsåld
          </span>
        )}
      </div>
      <div className="relative z-20 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric">{product.category}</p>
        <h3 className="mt-1 font-display text-lg font-bold leading-tight">{product.name}</h3>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xl font-bold">{formatSEK(product.price)}</span>
          <button
            disabled={out}
            onClick={() => {
              add(product);
              toast.success(`${product.name} lades i varukorgen`, {
                action: { label: "Visa", onClick: () => setOpen(true) },
              });
            }}
            className="flex h-10 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-all hover:bg-gold hover:text-gold-foreground disabled:opacity-40 disabled:hover:bg-foreground disabled:hover:text-background"
          >
            <Plus className="h-4 w-4" /> Lägg till
          </button>
        </div>
      </div>
    </div>
  );
}
