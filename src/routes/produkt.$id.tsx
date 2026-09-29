import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Minus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { formatSEK } from "@/lib/products";

export const Route = createFileRoute("/produkt/$id")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { data: products, isLoading } = useProducts();
  const { add, setOpen } = useCart();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Laddar…</div>;
  }

  const product = products?.find((p) => p.id === id);
  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Produkten hittades inte</h1>
        <Link to="/shop" className="mt-4 inline-block text-sm font-semibold text-gold hover:underline">
          Tillbaka till shopen
        </Link>
      </div>
    );
  }

  const gallery = product.images.length > 0 ? product.images : [product.image];
  const out = product.stock === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/shop" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Till shopen
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl border border-border bg-card">
            <img src={gallery[activeImg]} alt={product.name} width={1024} height={1024} className="h-full w-full object-cover" />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border ${i === activeImg ? "border-gold" : "border-border"}`}
                >
                  <img src={src} alt="" width={256} height={256} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric">{product.category}</p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight">{product.name}</h1>
          <p className="mt-3 text-2xl font-bold">{formatSEK(product.price)}</p>
          <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>

          {out ? (
            <p className="mt-6 text-sm font-semibold text-destructive">Slutsåld just nu</p>
          ) : (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-3 rounded-full border border-border px-3 py-1.5">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Minska antal">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label="Öka antal">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => {
                  add(product, qty);
                  toast.success(`${product.name} lades i varukorgen`, { action: { label: "Visa", onClick: () => setOpen(true) } });
                }}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-gold hover:text-gold-foreground"
              >
                <Plus className="h-4 w-4" /> Lägg till i varukorgen
              </button>
            </div>
          )}

          {product.category === "Overaller" && (
            <p className="mt-4 rounded-xl border border-border bg-surface p-3 text-xs text-muted-foreground">
              Beställer er klass 25+ overaller? Kontakta oss på mail så ordnar vi klasspris.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
