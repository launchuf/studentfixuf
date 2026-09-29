import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { CartProvider } from "../lib/cart";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/site/CookieBanner";

const SITE_URL = "https://studentfixuf.se";
const OG_IMAGE = `${SITE_URL}/og-image.svg`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="font-display text-[clamp(6rem,25vw,14rem)] font-extrabold leading-none text-gold/20">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Sidan finns inte</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        Sidan du letar efter finns inte eller har flyttats. Kolla länken igen eller gå tillbaka till startsidan.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="rounded-full bg-brand-gradient px-7 py-3.5 font-semibold text-primary-foreground">
          Till startsidan
        </Link>
        <Link to="/shop" className="rounded-full border border-border px-7 py-3.5 font-semibold hover:border-gold">
          Till shoppen
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Sidan kunde inte laddas</h1>
        <p className="mt-2 text-sm text-muted-foreground">Något gick fel. Prova att ladda om eller gå tillbaka hem.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Försök igen
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            Startsidan
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Studentfix UF" },
      { name: "theme-color", content: "#0b0b0f" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Studentfix" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Studentfix — Studenten ska göras rätt" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "canonical", href: SITE_URL },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Studentfix UF",
          url: SITE_URL,
          logo: `${SITE_URL}/favicon.png`,
          foundingDate: "2026",
          foundingLocation: { "@type": "Place", name: "Helsingborg, Sverige" },
          contactPoint: { "@type": "ContactPoint", email: "studentfix.uf@gmail.com", contactType: "customer service" },
          sameAs: ["https://instagram.com/studentfix.uf", "https://tiktok.com/@studentfix.uf"],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="sv" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Outlet />
        <Toaster position="bottom-center" />
        <CookieBanner />
      </CartProvider>
    </QueryClientProvider>
  );
}
