# Security hardening applied from CodeRabbit scan

This revision addresses the 8 findings from the 2026-09-29 CodeRabbit scan:

1. Checkout cancellation IDOR: removed public cancelOrder and automatic cancellation from the failed-payment URL.
2. Payment confirmation data disclosure: confirmPayment now requires the stored Stripe session ID before returning customer data.
3. Payment confirmation authorization bypass: confirmation verifies stored session ID, Stripe session ID, order reference, amount, currency, and paid/complete state; a missing stored session ID is no longer accepted.
4. Admin-role information disclosure: has_role no longer trusts a caller-supplied user ID; the browser uses the one-argument helper.
5. Stripe open redirect: return URLs are built only from PUBLIC_SITE_URL or the fixed https://studentfixuf.se fallback; client-supplied origin is removed.
6. Inactive product disclosure: anonymous/authenticated catalog reads are limited to active products unless the authenticated caller is an admin.
7. Inactive product-image disclosure: public product_images reads are limited to images belonging to active products unless the authenticated caller is an admin.
8. Checkout stock race: checkout now reserves stock atomically in PostgreSQL and finalizes the reservation only when Stripe payment is verified.

Additional correctness fixes included:
- Server shipping now matches the checkout UI (59 kr below the free-shipping threshold).
- Order numbers no longer use timestamp + Math.random(); they use crypto.randomUUID().
- Stripe session IDs must be stored successfully or checkout is failed and the reservation is released.
- Deprecated createServerFn().inputValidator() calls were replaced with .validator().
- Cloudflare Worker env access now uses cloudflare:workers, with that runtime module externalized from Vite/Rolldown.

For an existing Supabase database, run:
  drizzle/migrations/0002_security_hardening.sql

For a fresh database, schema.sql includes the hardened policies and stock-reservation functions.
