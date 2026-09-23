import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, CreditCard, Smartphone } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCart } from "@/lib/cart";
import { formatSEK } from "@/lib/products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TITLE = "Kassa — Studentfix";
const DESC = "Slutför din beställning hos Studentfix.";

export const Route = createFileRoute("/kassa")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const [done, setDone] = useState(false);
  const [pay, setPay] = useState<"swish" | "kort">("swish");
  const shipping = subtotal >= 800 || subtotal === 0 ? 0 : 59;

  if (done) {
    return (
      <SiteLayout>
        <section className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-gold animate-rise" />
          <h1 className="mt-6 font-display text-5xl font-extrabold">Tack!</h1>
          <p className="mt-4 text-muted-foreground">
            Din beställning är mottagen. Vi hör av oss på mejl så snart den är packad. Nu är det bara att börja
            planera designen.
          </p>
          <Link to="/shop" className="mt-8 rounded-full bg-brand-gradient px-7 py-3.5 font-semibold text-primary-foreground">
            Fortsätt shoppa
          </Link>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 pt-40">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-electric">Kassa</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold md:text-6xl">Nästan klart.</h1>

        {items.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
            Varukorgen är tom.{" "}
            <Link to="/shop" className="font-semibold text-gold hover:underline">
              Gå till shoppen
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              clear();
              setDone(true);
              window.scrollTo({ top: 0 });
            }}
            className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr]"
          >
            <div className="space-y-8">
              <Block title="Kontakt">
                <Field id="name" label="Namn" placeholder="För- och efternamn" required />
                <Field id="email" label="E-post" type="email" placeholder="du@exempel.se" required />
                <Field id="phone" label="Mobil" placeholder="07X-XXX XX XX" />
                <Field id="school" label="Skola & klass" placeholder="t.ex. Nicolaiskolan NA3B" />
              </Block>
              <Block title="Leverans">
                <Field id="address" label="Adress" placeholder="Gatuadress" required />
                <div className="grid grid-cols-2 gap-4">
                  <Field id="zip" label="Postnummer" placeholder="252 XX" required />
                  <Field id="city" label="Ort" placeholder="Helsingborg" required />
                </div>
              </Block>
              <Block title="Betalning">
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["swish", "Swish", Smartphone],
                      ["kort", "Kort", CreditCard],
                    ] as const
                  ).map(([k, l, Icon]) => (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setPay(k)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-4 text-left font-semibold transition-all",
                        pay === k ? "border-gold bg-gold/10" : "border-border hover:border-muted-foreground",
                      )}
                    >
                      <Icon className={cn("h-5 w-5", pay === k && "text-gold")} /> {l}
                    </button>
                  ))}
                </div>
              </Block>
            </div>

            <aside className="h-fit rounded-3xl border border-border bg-card p-6 lg:sticky lg:top-28">
              <h2 className="font-display text-xl font-bold">Din order</h2>
              <ul className="mt-5 space-y-4">
                {items.map(({ product, qty }) => (
                  <li key={product.id} className="flex items-center gap-3">
                    <img src={product.image} alt="" width={1024} height={1024} loading="lazy" className="h-14 w-14 rounded-xl object-cover" />
                    <div className="flex-1 text-sm">
                      <p className="font-semibold leading-tight">{product.name}</p>
                      <p className="text-muted-foreground">{qty} st</p>
                    </div>
                    <span className="text-sm font-semibold">{formatSEK(product.price * qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
                <Row l="Delsumma" v={formatSEK(subtotal)} />
                <Row l="Frakt" v={shipping === 0 ? "Fri" : formatSEK(shipping)} />
                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold">Totalt</span>
                  <span className="font-display text-2xl font-bold">{formatSEK(subtotal + shipping)}</span>
                </div>
              </div>
              <button type="submit" className="mt-6 w-full rounded-full bg-brand-gradient py-4 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] glow-violet">
                Slutför köp
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">14 dagars öppet köp på oanvända varor.</p>
            </aside>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}
function Field({ id, label, ...rest }: React.ComponentProps<typeof Input> & { id: string; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input id={id} name={id} {...rest} className="h-11 rounded-xl border-border bg-surface" />
    </div>
  );
}
function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{l}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}
