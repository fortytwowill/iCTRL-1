# Deployment Guide

## Purpose

Deploy InventoryCTRL frontend and its Supabase/Stripe integrations to production.

## Audience

Engineers responsible for release and operations.

## Prerequisites

- Code pushed to GitHub
- Production Supabase project
- Stripe products and webhook configured (if billing enabled)

## Pre-deploy checklist

- Migrations applied: `supabase db push`
- Function secrets set (see `docs/reference/stripe-secrets-and-config.md`)
- Edge Functions deployed
- Auth redirect URLs configured in Supabase

## Frontend deployment

### Vercel

1. Import the repository.
2. Use build command `npm run build`.
3. Use output directory `dist`.
4. Set frontend env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_APP_URL` (`https://ictrl.app` in production)
- Optional `VITE_SUPABASE_PUBLISHABLE_KEY`
- Optional PostHog vars (`VITE_POSTHOG_API_KEY`, `VITE_POSTHOG_HOST`)

#### SPA routing (required for refresh/deep links)

Because the frontend uses React Router with browser history, Vercel must rewrite route requests
to `index.html` so direct loads like `/login` do not return `404`.

Add `vercel.json` at repo root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Netlify

Use the same build/output/env settings as Vercel.

## Supabase settings

Configure in `supabase/config.toml` and dashboard:

- `site_url`: `https://ictrl.app` in the production Supabase dashboard
- `additional_redirect_urls`: include `https://ictrl.app`, `https://www.ictrl.app`, `https://invctrl.vercel.app`, and `http://localhost:5173` during rollout
- `functions.stripe-webhook.verify_jwt = false` (public Stripe callback endpoint)
- Membership management functions must keep gateway JWT verification disabled:
  - `functions.invite-user.verify_jwt = false`
  - `functions.accept-invitation.verify_jwt = false`
  - `functions.delete-user.verify_jwt = false`
  - `functions.cancel-invitation.verify_jwt = false`
  - `functions.update-user-role.verify_jwt = false`
  - These functions verify auth in-code via `userClient.auth.getUser()`.

## Deploy functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy invite-user --no-verify-jwt
supabase functions deploy accept-invitation --no-verify-jwt
supabase functions deploy delete-user --no-verify-jwt
supabase functions deploy cancel-invitation --no-verify-jwt
supabase functions deploy update-user-role --no-verify-jwt
supabase functions deploy trial-lifecycle-notifier
```

## Verification

1. Open deployed app and sign in.
2. Open `/subscribe` and start checkout.
3. Complete Stripe test payment.
4. Confirm:

- `subscriptions` row is created/updated.
- `organizations.subscription_status` changes to `active`.
- Returning user reaches dashboard.

## Recovery / rollback

- If checkout breaks, validate function secrets and webhook signature first.
- Re-deploy only affected functions after secret correction.
- For temporary containment, disable billing CTA in frontend release and keep webhook active.

## Related docs

- `docs/STRIPE_SETUP.md`
- `docs/reference/stripe-billing-flow.md`
- `docs/runbooks/stripe-webhook-operations.md`
