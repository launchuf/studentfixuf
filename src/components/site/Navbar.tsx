import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const links = [
  { to: "/", label: "Hem" },
  { to: "/shop", label: "Shop" },
  { to: "/om-oss", label: "Om oss" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

export function Navbar() {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={cn(
          "flex w-full max-w-6xl items-center justify-between rounded-full px-4 py-2 transition-all duration-500",
          scrolled ? "glass shadow-card" : "bg-transparent border border-transparent",
        )}
      >
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setMenu(false)}>
          <img src={logo} alt="Studentfix" width={1024} height={1024} className="h-9 w-9 object-contain" />
          <span className="font-display text-lg font-bold tracking-tight">
            Student<span className="text-gold">fix</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary/60" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            aria-label="Öppna varukorg"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary/70 transition-all hover:bg-secondary hover:scale-105"
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                {count}
              </span>
            )}
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/70 md:hidden"
            onClick={() => setMenu((m) => !m)}
            aria-label="Meny"
          >
            {menu ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </nav>

      {menu && (
        <div className="glass absolute inset-x-4 top-20 rounded-3xl p-4 shadow-card md:hidden animate-rise">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenu(false)}
              className="block rounded-2xl px-4 py-3 font-display text-2xl font-semibold hover:bg-secondary"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
