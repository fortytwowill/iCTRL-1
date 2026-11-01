# Stripe Secrets and Function Config

## Required secrets

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_BUSINESS`
- `STRIPE_PRICE_ENTERPRISE`

Supabase function runtime:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

CORS / URL behavior:

- `ALLOWED_ORIGIN` (comma-separated allowed origins)
- `SITE_URL`
- `APP_URL` (optional override used by invitation/trial-notifier flows)

## Function auth model

Configured in `supabase/config.toml`:

- `[functions.create-checkout-session] verify_jwt = true`
- `[functions.stripe-webhook] verify_jwt = false`

Rationale:

- App users call checkout with Supabase session JWT.
- Stripe cannot send Supabase JWT, so webhook endpoint must be public and rely on Stripe signature verification.

## CORS behavior

`create-checkout-session` resolves allowed origin from `ALLOWED_ORIGIN`.

- Supports comma-separated allowlist.
- Trims trailing slashes.
- Returns wildcard only when `ALLOWED_ORIGIN` includes `*`.

## Local test loop

1. Deploy both functions:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

1. Forward Stripe events locally:

```bash
stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

1. Trigger test checkout and confirm webhook updates.
