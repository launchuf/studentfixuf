import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { formatSEK } from "@/lib/products";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove, subtotal, count } = useCart();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col border-border bg-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">
            Varukorg <span className="text-muted-foreground">({count})</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {items.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <ShoppingBag className="mb-3 h-10 w-10 opacity-40" />
              <p>Din varukorg är tom.</p>
              <Link to="/shop" onClick={() => setOpen(false)} className="mt-4 text-sm font-semibold text-gold hover:underline">
                Gå till shoppen →
              </Link>
            </div>
          )}
          {items.map(({ product, qty }) => (
            <div key={product.id} className="flex gap-4 rounded-2xl border border-border bg-surface p-3">
              <img src={product.image} alt={product.name} width={1024} height={1024} loading="lazy" className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex flex-1 flex-col">
                <p className="text-sm font-semibold leading-tight">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-border">
                    <button className="p-1.5 hover:text-gold" onClick={() => setQty(product.id, qty - 1)} aria-label="Minska">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                    <button className="p-1.5 hover:text-gold" onClick={() => setQty(product.id, qty + 1)} aria-label="Öka">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold">{formatSEK(product.price * qty)}</span>
                </div>
              </div>
              <button onClick={() => remove(product.id)} className="self-start text-muted-foreground hover:text-destructive" aria-label="Ta bort">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delsumma</span>
              <span className="font-display text-xl font-bold">{formatSEK(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Frakt beräknas i kassan. Fri frakt över 800 kr.</p>
            <Link
              to="/kassa"
              onClick={() => setOpen(false)}
              className="mt-4 flex w-full items-center justify-center rounded-full bg-brand-gradient py-3.5 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] glow-violet"
            >
              Till kassan
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
