# Architecture

## Purpose

Describe the current system architecture, including billing (Stripe) and analytics (PostHog).

## System overview

InventoryCTRL is a React SPA backed by Supabase:

- Frontend: React + TypeScript + Vite
- Backend: Supabase Postgres, Auth, RLS, Edge Functions
- Billing: Stripe via `create-checkout-session` and `stripe-webhook`
- Analytics: PostHog client-side events

## High-level flow

1. User authenticates with Supabase Auth.
2. Frontend reads data through Supabase JS client.
3. RLS enforces organization isolation.
4. Billing state is resolved through `get_effective_plan` RPC.
5. Analytics events are emitted from frontend interaction points.

## Billing architecture

### Frontend path

- `/subscribe` (see `src/pages/Subscribe.tsx`) calls `create-checkout-session`.
- User is redirected to Stripe Checkout.
- Stripe redirects back to `/subscribe?success=true` or `?canceled=true`.

### Backend path

- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/migrations/*subscriptions*.sql`

### Admin trial RPCs

`admin_set_trial_end_date` and `admin_extend_trial` atomically update both `organizations.trial_ends_at` and `subscriptions.trial_ends_at` (with matching subscription status), so the trial banner and `get_trial_ends_at` always match the admin-set date. Day-based extensions round partial days up to full 24h periods. Refresh the page after an admin edits a trial date to see the change. Reconciliation is limited to organizations currently in trial with an audited `set_trial_end_date` date.

### Auth expectations

- `create-checkout-session`: authenticated call (JWT required).
- `stripe-webhook`: public callback endpoint, JWT verification disabled in config, signature verified with `STRIPE_WEBHOOK_SECRET`.
- Membership functions (`invite-user`, `accept-invitation`, `delete-user`, `cancel-invitation`, `update-user-role`):
  - Supabase gateway JWT verification must stay disabled (`verify_jwt = false`).
  - Each function authenticates inside the handler with `userClient.auth.getUser()`.
  - This avoids edge gateway `Invalid JWT` regressions while preserving authorization checks in function code.

## Analytics architecture

### Initialization

- `initPostHog()` is invoked in `src/App.tsx`.
- Analytics is disabled when API key is missing or placeholder.

### Identity lifecycle

- User/profile changes in `AuthContext` trigger:
- `identifyUser(...)`
- `setUserProperties(...)`
- `resetAnalyticsIdentity()` on sign out/no user

### Event emission

Primary implemented emitters:

- Subscription page (`trackSubscriptionViewed`, `trackPlanSelected`, `trackCheckoutStarted`, `trackTrialStarted`)
- Scanner page (`trackScanSuccess`, `trackScanFailed`)
- Setup wizard (`trackWizardStepStarted`, `trackWizardStepCompleted`, `trackWizardCompleted`, `trackItemCreated`)

See detailed taxonomy: `docs/reference/posthog-event-taxonomy.md`.

## Data model highlights

- `organizations`: org metadata + subscription status
- `profiles`: user role + org relation
- `subscriptions`: Stripe subscription mirror
- `plan_limits`: entitlement caps (`trial`, `starter`, `business`, `enterprise`)

## Security

- Supabase RLS across domain tables
- JWT auth for protected function calls
- Stripe webhook signature verification
- Organization scoping for writes and reads

## Related docs

- `docs/reference/stripe-billing-flow.md`
- `docs/reference/stripe-secrets-and-config.md`
- `docs/reference/posthog-implementation.md`
- `docs/reference/posthog-event-taxonomy.md`
