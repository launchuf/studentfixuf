# Studentfix UF

Premium studentoveraller, sprayflaskor, mallar och studentband. Webbutik byggd med **TanStack Start (SSR)**, **Supabase** och **Stripe**, deployas till **Cloudflare Workers**.

## Stack
- **Frontend/SSR:** TanStack Start (React 19) + Vite 8
- **Databas & auth:** Supabase (Postgres + RLS, e-post/lösenord)
- **Betalning:** Stripe Checkout Sessions
- **Hosting:** Cloudflare Workers (Nitro `cloudflare-module` preset)

## Kom igång lokalt

```bash
npm install
cp .env.example .env   # fyll i dina nycklar (se nedan)
npm run dev            # öppnas på http://localhost:8080
```

## Miljövariabler

| Variabel | Beskrivning |
|---|---|
| `SUPABASE_URL` + `VITE_SUPABASE_URL` | Din Supabase-projekt-URL |
| `SUPABASE_PUBLISHABLE_KEY` + `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable-nyckel |
| `SUPABASE_SERVICE_ROLE_KEY` | **Hemlig** — används bara server-side |
| `STRIPE_SECRET_KEY` | Stripe secret key — krävs för riktig checkout |
| `PUBLIC_SITE_URL` | Betrodd HTTPS-origin för Stripe return URLs (standard: `https://studentfixuf.se`) |
| `STRIPE_WEBHOOK_SECRET` | Valfri — för webhook-bekräftelse i produktion |

Sätt dessa som **Cloudflare Secrets** (Worker → Settings → Variables) och lägg även i lokal `.env`.

## Databas

Kör `schema.sql` en gång i Supabase SQL Editor på ett tomt projekt. Skapar:
- `products`, `orders`, `order_items`, `stock_reservations` — butik + säkra lagerreservationer
- `user_roles` — adminhantering
- `contact_messages` — kontaktformulär
- RLS-policyer + startprodukter

För en befintlig installation: kör `drizzle/migrations/0002_security_hardening.sql` efter migration `0001`. Den låser rollkontroll, publik produkt-/bildåtkomst och checkout-lagerreservationer.

## Admin

Besök `/admin` på live-sajten. Logga in med ett konto som har adminrollen i `user_roles`. Skapa det första kontot via Supabase Auth och kör sedan:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<din-user-id-från-supabase-auth>', 'admin');
```

## Deploy till Cloudflare

```bash
npm run build
npx nitro deploy --prebuilt
```

Eller koppla GitHub-repot till Cloudflare Workers CI. Build-kommando: `npm run build`. Output: `dist/`.

## SEO / Launch checklist

- [x] Unik `<title>` + `<meta description>` per sida
- [x] OG-bild (`/og-image.svg`) + twitter:card
- [x] Schema.org Organization markup
- [x] `robots.txt` (blockerar /admin, /kassa, /betalning)
- [x] `sitemap.xml`
- [x] Canonical URL i root
- [x] Cookie-banner (GDPR — endast session-cookie)
- [x] Integritetspolicy + Köpvillkor
- [x] Kontaktformulär med honeypot-skydd + server-side rate limit
- [x] Aria-etiketter + h1 per sida
- [x] SSR aktivt (TanStack Start med Cloudflare Workers)
- [ ] Lägg till sajten i Google Search Console
- [ ] Generera riktig OG-bild (1200×630 PNG) och ersätt `/public/og-image.svg`
- [ ] Aktivera Stripe med riktig `sk_live_...`-nyckel
