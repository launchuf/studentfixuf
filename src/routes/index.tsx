import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Users, Truck, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { ProductCard } from "@/components/site/ProductCard";
import { type Category } from "@/lib/products";
import { useProducts } from "@/lib/catalog";
import hero from "@/assets/hero.jpg";
import logo from "@/assets/logo.png";
import overallImg from "@/assets/product-overall.jpg";
import sprayImg from "@/assets/product-spray.jpg";
import stencilImg from "@/assets/product-stencil.jpg";
import bandImg from "@/assets/product-band.jpg";

const TITLE = "Studentfix — Studenten ska göras rätt";
const DESC =
  "Premium studentoveraller, sprayflaskor, återanvändbara mallar och personliga studentband. UF-företag från Helsingborg.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Index,
});

const categories: { name: Category; desc: string; img: string; accent: string }[] = [
  { name: "Overaller", desc: "Tjock twill, guldbroderi, byggd för hela våren.", img: overallImg, accent: "from-violet" },
  { name: "Sprayflaskor", desc: "Matta textilsprayer som tål tvätt och tid.", img: sprayImg, accent: "from-electric" },
  { name: "Mallar", desc: "Återanvändbara schabloner för siffror & initialer.", img: stencilImg, accent: "from-gold" },
  { name: "Studentband", desc: "Ditt namn broderat i guld. Levereras i ask.", img: bandImg, accent: "from-violet" },
];

function Index() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { data: products } = useProducts();

  // Parallax on hero image
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const fn = () => {
      const y = window.scrollY;
      el.style.transform = `translateY(${y * 0.25}px) scale(${1 + y * 0.0002})`;
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden noise">
        <div ref={heroRef} className="absolute inset-0 will-change-transform">
          <img src={hero} alt="Studenter i sprayade overaller i Helsingborg" width={1600} height={1008} className="h-full w-full object-cover object-top" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-40">
          <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Helsingborg · Klass 2027
          </div>
          <h1 className="animate-rise mt-6 max-w-4xl font-display text-[clamp(3rem,9vw,7.5rem)] font-extrabold leading-[0.92] [animation-delay:120ms]">
            Studenten
            <br />
            ska göras <span className="text-gold-shimmer">rätt.</span>
          </h1>
          <p className="animate-rise mt-6 max-w-lg text-lg text-muted-foreground [animation-delay:240ms]">
            Premium overaller, sprayer, mallar och band — designat av studenter, för studenter som vägrar smälta in.
          </p>
          <div className="animate-rise mt-10 flex flex-wrap items-center gap-4 [animation-delay:360ms]">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-gradient px-7 py-4 font-semibold text-primary-foreground transition-transform hover:scale-105 glow-violet"
            >
              Shoppa nu
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/om-oss" className="rounded-full border border-border bg-background/40 px-7 py-4 font-semibold backdrop-blur transition-colors hover:border-gold hover:text-gold">
              Vår story
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground md:flex">
          Scrolla
          <span className="h-10 w-px animate-pulse bg-gradient-to-b from-gold to-transparent" />
        </div>
      </section>

      {/* MARQUEE */}
      <div className="relative border-y border-border bg-surface py-4">
        <div className="flex overflow-hidden hide-scrollbar">
          <div className="flex shrink-0 animate-marquee items-center gap-12 whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.3em]">
            {Array.from({ length: 2 }).map((_, k) =>
              ["Premium overaller", "Textilsprayer", "Återanvändbara mallar", "Personliga band", "Klassrabatt", "Helsingborg"].map((t, i) => (
                <span key={`${k}-${i}`} className="flex items-center gap-12">
                  <span className={i % 3 === 0 ? "text-gold" : i % 3 === 1 ? "text-violet" : "text-electric"}>{t}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                </span>
              )),
            )}
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <section className="relative mx-auto max-w-6xl px-6 pt-28">
        <div className="grid-bg pointer-events-none absolute inset-0 -z-10" />
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-electric">Kollektionen</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold md:text-6xl">Allt du behöver för att äga studenten.</h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <Reveal key={c.name} delay={i * 90}>
              <Link
                to="/shop"
                search={{ kategori: c.name }}
                className="group relative block aspect-[3/4] overflow-hidden rounded-3xl border border-border bg-card shadow-card"
              >
                <img src={c.img} alt={c.name} width={1024} height={1024} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className={`absolute inset-0 bg-gradient-to-t ${c.accent} via-background/30 to-transparent opacity-70 transition-opacity group-hover:opacity-90`} />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-display text-2xl font-bold">{c.name}</h3>
                  <p className="mt-1 text-sm text-foreground/80">{c.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                    Utforska <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-6xl px-6 pt-32">
        <Reveal className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Populärt just nu</p>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Bästsäljarna</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-2 text-sm font-semibold hover:text-gold md:flex">
            Hela shoppen <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(products ?? []).filter((p) => p.active).sort((a, b) => b.sold - a.sold).slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 100}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* KLASSRABATT */}
      <section className="mx-auto max-w-6xl px-6 pt-32">
        <Reveal>
          <div className="gradient-border relative overflow-hidden rounded-[2rem] bg-card p-10 md:p-16 noise">
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet/30 blur-[120px] animate-glow" />
            <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-electric/25 blur-[120px] animate-glow [animation-delay:2s]" />
            <div className="relative grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Klassrabatt</p>
                <h2 className="mt-3 font-display text-4xl font-bold md:text-6xl">
                  Hela klassen. <span className="text-gradient">Bättre pris.</span>
                </h2>
                <p className="mt-5 max-w-md text-muted-foreground">
                  Beställ tillsammans och lås upp rabatt på hela ordern. Ju fler ni är, desto mer sparar ni — och alla får
                  samma leverans till skolan.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  {[
                    ["10+", "10 % rabatt"],
                    ["20+", "15 % rabatt"],
                    ["30+", "20 % + gratis band"],
                  ].map(([n, t]) => (
                    <div key={n} className="rounded-2xl border border-border bg-background/50 px-5 py-4 backdrop-blur">
                      <p className="font-display text-3xl font-extrabold text-gold">{n}</p>
                      <p className="text-xs text-muted-foreground">{t}</p>
                    </div>
                  ))}
                </div>
                <Link to="/kontakt" className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 font-semibold text-background transition-colors hover:bg-gold">
                  <Users className="h-4 w-4" /> Boka klassrabatt
                </Link>
              </div>
              <div className="relative flex justify-center">
                <img src={logo} alt="Studentfix" width={1024} height={1024} loading="lazy" className="w-64 animate-float drop-shadow-[0_30px_40px_rgba(124,58,237,0.45)] md:w-80" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* USPs */}
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pt-24 md:grid-cols-3">
        {[
          { icon: Truck, t: "Leverans till skolan", d: "Beställ som klass och få allt levererat samlat, utan krångel." },
          { icon: ShieldCheck, t: "Kvalitet som håller", d: "Vi har testat allt själva. Inga tunna overaller, ingen spray som flagnar." },
          { icon: Sparkles, t: "Designat i Helsingborg", d: "Av fyra studenter som själva tar studenten 2027." },
        ].map((u, i) => (
          <Reveal key={u.t} delay={i * 100} className="rounded-3xl border border-border bg-card p-7 transition-colors hover:border-violet/50">
            <u.icon className="h-6 w-6 text-gold" />
            <h3 className="mt-4 font-display text-xl font-bold">{u.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{u.d}</p>
          </Reveal>
        ))}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pt-32 text-center">
        <Reveal>
          <h2 className="font-display text-5xl font-extrabold md:text-8xl">
            Redo att <span className="text-gold-shimmer">sticka ut?</span>
          </h2>
          <Link to="/shop" className="mt-10 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-10 py-5 text-lg font-semibold text-primary-foreground transition-transform hover:scale-105 glow-violet">
            Till shoppen <ArrowRight className="h-5 w-5" />
          </Link>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
