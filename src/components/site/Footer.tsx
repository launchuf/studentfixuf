import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

function TikTok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="" width={1024} height={1024} loading="lazy" className="h-12 w-12 object-contain" />
              <div>
                <p className="font-display text-2xl font-bold">
                  Student<span className="text-gold">fix</span>
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Studenten ska göras rätt</p>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-sm text-muted-foreground">
              UF-företag från Helsingborg, grundat 2026. Vi gör premium studentoveraller, sprayer, mallar och band för dig
              som vill sticka ut när det räknas.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sidor</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-gold transition-colors">Shop</Link></li>
              <li><Link to="/om-oss" className="hover:text-gold transition-colors">Om oss</Link></li>
              <li><Link to="/kontakt" className="hover:text-gold transition-colors">Kontakt</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Följ oss</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="https://instagram.com/studentfix.uf" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold transition-colors">
                  <Instagram className="h-4 w-4" /> @studentfix.uf
                </a>
              </li>
              <li>
                <a href="https://tiktok.com/@studentfix.uf" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold transition-colors">
                  <TikTok className="h-4 w-4" /> @studentfix.uf
                </a>
              </li>
              <li>
                <a href="mailto:studentfix.uf@gmail.com" className="flex items-center gap-2 hover:text-gold transition-colors">
                  <Mail className="h-4 w-4" /> studentfix.uf@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© 2027 Studentfix UF · Helsingborg</p>
          <p className="font-display text-[11px] uppercase tracking-[0.3em]">Klass 2027</p>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_at_bottom,_color-mix(in_oklab,var(--violet)_25%,transparent),transparent_70%)]" />
    </footer>
  );
}
