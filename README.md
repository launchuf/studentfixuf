# Studentfix

Studentoveraller, sprayflaskor, mallar och studentband — webbutik byggd med TanStack Start, Supabase och Stripe, som deployas till Cloudflare Workers.

## Stack
- **Frontend/SSR:** TanStack Start (React) + Vite
- **Databas & auth:** Supabase (Postgres, e-post/lösenord-inloggning)
- **Betalning:** Stripe Checkout
- **Hosting:** Cloudflare Workers (via Nitro's `cloudflare-module` preset)

## Kom igång lokalt

```bash
npm install
cp .env.example .env   # fyll i dina egna nycklar
npm run dev
```

## Miljövariabler

| Variabel | Var den används | Beskrivning |
|---|---|---|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | klient + server | Din Supabase-projekt-URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | klient + server | Supabase anon/publishable-nyckel |
| `SUPABASE_SERVICE_ROLE_KEY` | endast server | Service role-nyckel — **hemlig**, används bara i `*.server.ts`-filer |
| `STRIPE_SECRET_KEY` | endast server | Din Stripe secret key (`sk_test_...` / `sk_live_...`). Saknas den körs kassan i demoläge |

Sätt secrets i Cloudflare (`wrangler secret put ...` eller Dashboard → Workers → Settings → Variables) och i `.env` lokalt. `.env` är gitignorad — checka aldrig in nycklar.

## Databas

Schemat ligger i [`schema.sql`](./schema.sql) (även speglat i `drizzle/migrations/0000_studentfix_core_schema.sql`). Kör det i Supabase SQL Editor på ett tomt projekt för att skapa tabellerna `products`, `orders`, `order_items` och `user_roles`, samt RLS-policyer och startprodukterna.

## Adminpanelen

Gå till `/admin/login`. Första gången: ingen admin finns ännu, så sidan låter dig skapa det första kontot (det får automatiskt adminrollen). Därefter krävs inloggning + adminrollen för allt under `/admin`.

## Deploy till Cloudflare

```bash
npm run build
npx nitro deploy --prebuilt
```

eller koppla repot till Cloudflare Workers/Pages CI och låt det köra `npm run build`. Kom ihåg att sätta miljövariablerna ovan som secrets i Cloudflare-projektet.

## Stripe

Checkout-koden (`src/lib/checkout.functions.ts`) skapar en Stripe Checkout Session om `STRIPE_SECRET_KEY` finns, annars körs ett demoläge som markerar ordern som betald direkt (bra för att testa flödet utan riktiga nycklar). För produktion, lägg även till en webhook mot `/api/...` om ni vill bekräfta betalningar serverside istället för på success-sidan (inte implementerat ännu).
