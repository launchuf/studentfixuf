import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { CATEGORIES, type Category } from "@/lib/products";
import { useProducts } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const TITLE = "Shop — Studentfix";
const DESC = "Handla studentoveraller, sprayflaskor, mallar och personliga studentband från Studentfix.";

const searchSchema = z.object({
  kategori: z.enum(["Overaller", "Sprayflaskor", "Mallar", "Studentband"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { kategori } = Route.useSearch();
  const { data: products, isLoading, isError } = useProducts();
  const list = (products ?? []).filter((p) => p.active && (!kategori || p.category === kategori));

  return (
    <SiteLayout>
      <section className="relative mx-auto max-w-6xl px-6 pt-40">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet/20 blur-[160px]" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-electric">Shop</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold md:text-7xl">
          {kategori ?? "Hela kollektionen"}
        </h1>

        <div className="mt-10 flex flex-wrap gap-2">
          <Filter to={undefined} active={!kategori} label="Allt" />
          {CATEGORIES.map((c) => (
            <Filter key={c} to={c} active={kategori === c} label={c} />
          ))}
        </div>

        {isLoading && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        )}

        {isError && (
          <p className="mt-12 text-sm text-muted-foreground">
            Kunde inte hämta produkterna just nu. Försök ladda om sidan.
          </p>
        )}

        {!isLoading && !isError && list.length === 0 && (
          <p className="mt-12 text-sm text-muted-foreground">Inga produkter i den här kategorin just nu.</p>
        )}

        {!isLoading && !isError && list.length > 0 && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function Filter({ to, active, label }: { to: Category | undefined; active: boolean; label: string }) {
  return (
    <Link
      to="/shop"
      search={to ? { kategori: to } : {}}
      className={cn(
        "rounded-full border px-5 py-2.5 text-sm font-semibold transition-all",
        active ? "border-transparent bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:border-gold hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
