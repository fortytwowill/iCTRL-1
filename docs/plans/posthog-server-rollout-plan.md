# Server-to-PostHog Connection Plan (Supabase Edge Functions)

## Summary

You already have strong client-side PostHog instrumentation. Next step is to add **authoritative server-side event emission** for backend-truth flows (billing lifecycle, webhooks, invitation acceptance/sending, destructive admin actions), while preserving your existing event taxonomy and adding a `event_source: "server"` marker for clean analysis.

Defaults locked:

- Scope: **Authoritative Events**

- Region/host: **US Cloud** (`https://us.i.posthog.com`)

## Public API / Interface Changes

1. Add shared server analytics utility:

- New file: `supabase/functions/_shared/posthog.ts`

- Main interface:

  - `captureServerEvent(params: { event: ServerEventName; distinctId: string; organizationId?: string; actorUserId?: string; properties?: Record<string, unknown>; dedupeKey?: string; functionName: string; timestamp?: string; }) => Promise<void>`

- Behavior:

  - Best-effort (never throws into business flow)

  - Timeout-protected network call

  - Adds standard properties:

    - `event_source: "server"`

    - `runtime: "supabase_edge"`

    - `function_name`

    - `organization_id` (if present)

    - `actor_user_id` (if present)

    - `dedupe_key` (if present)

  - Sends to `POST ${POSTHOG_HOST}/capture/`

1. Add server env secrets (Supabase Function secrets):

- `POSTHOG_PROJECT_API_KEY` (project key)

- `POSTHOG_HOST=https://us.i.posthog.com`

- `POSTHOG_SERVER_ENABLED=true` (kill switch)

1. Add optional dedupe storage for webhook retries:

- New table: `analytics_event_dedupe`

- Columns: `dedupe_key text primary key`, `created_at timestamptz default now()`

- Used only for retry-prone sources (Stripe webhooks, session sync retries)

## Step-by-Step Implementation

1. Configure PostHog credentials

- In PostHog project settings, copy project API key.

- Confirm your ingestion region is US.

- Keep existing frontend key as-is; backend key stays in Supabase secrets.

1. Add Supabase secrets

- Set function secrets for PostHog:

  - `POSTHOG_PROJECT_API_KEY`

  - `POSTHOG_HOST`

  - `POSTHOG_SERVER_ENABLED`

- Do this in dashboard or CLI before deploying functions.

1. Implement shared server capture utility

- Create `supabase/functions/_shared/posthog.ts`.

- Implement:

  - env guards (`POSTHOG_SERVER_ENABLED`, missing key/host)

  - `captureServerEvent` using `fetch`

  - standardized property envelope

  - non-blocking failure handling (`console.error`, return)

  - timeout via `AbortController`

1. Instrument authoritative server functions first

- `supabase/functions/sync-checkout-session/index.ts`

  - Emit `checkout_completed`

- `supabase/functions/stripe-webhook/index.ts`

  - Emit `trial_converted` when status transitions trialing -> active

  - Emit `subscription_canceled` on cancellation paths

  - Emit `plan_upgrade_started` / `plan_downgrade_scheduled` when corresponding Stripe updates apply

- `supabase/functions/trial-lifecycle-notifier/index.ts`

  - Emit `trial_expired` only when org status actually transitions to expired

- `supabase/functions/invite-user/index.ts`

  - Emit `invitation_sent`

- `supabase/functions/accept-invitation/index.ts`

  - Emit `invitation_accepted`

- `supabase/functions/delete-user/index.ts`

  - Emit `user_removed`

1. Handle server authority gaps (role/cancel invitation)

- Current role change (`update_user_role`) and invitation cancel (`delete_invitation`) are RPC-based.

- Create edge wrappers to centralize these two actions server-side:

  - `supabase/functions/update-user-role/index.ts` emits `user_role_changed`

  - `supabase/functions/cancel-invitation/index.ts` emits `invitation_canceled`

- Update frontend callers in `AuthContext`/`UserManagement` to invoke wrappers instead of direct RPC for these operations.

1. Add dedupe for retry-prone sources

- For Stripe webhook events, use `dedupeKey = stripe_event_id + ":" + event_name`.

- Before capture, check/insert in `analytics_event_dedupe`; skip if already present.

- Apply same pattern optionally in `sync-checkout-session` using `session_id + ":" + event_name`.

1. Deploy in controlled order

- Deploy shared utility consumers:

  - `stripe-webhook`

  - `sync-checkout-session`

  - `trial-lifecycle-notifier`

  - `invite-user`

  - `accept-invitation`

  - `delete-user`

  - new wrappers (`update-user-role`, `cancel-invitation`)

- Keep `POSTHOG_SERVER_ENABLED=false` until all functions are deployed.

- Flip to `true` after smoke verification.

1. Validation pass

- Trigger each server-owned flow once.

- In PostHog Live Events, verify:

  - event names match taxonomy

  - `event_source = "server"`

  - distinct IDs are stable

  - expected properties are present

- Confirm no duplicate webhook events when Stripe retries.

1. Documentation sync

- Append a “Server Emission Points” section in:

  - `docs/reference/posthog-implementation.md`

- Add server QA scripts in:

  - `docs/runbooks/posthog-validation.md`

- Keep taxonomy unchanged unless a new server-only event name is introduced.

## Event Ownership Model (to prevent double counting)

1. Server-owned canonical events:

- `checkout_completed`

- `trial_converted`

- `trial_expired`

- `subscription_canceled`

- `invitation_sent`

- `invitation_accepted`

- `invitation_canceled`

- `user_role_changed`

- `user_removed`

1. Client-owned interaction events:

- Scanner interactions

- Search/filter/dashboard interactions

- Local UI intent events (`plan_selected`, `checkout_started`, etc.)

1. Transition rule:

- During rollout, allow temporary dual-emission but always include `event_source`.

- After server confidence, remove client emission for server-owned canonical events.

## Test Cases and Scenarios

1. Stripe checkout success:

- Expected server event: `checkout_completed` once per successful session.

1. Trial expiration scheduler run:

- Expected server event: `trial_expired` only on actual status transition.

1. Invitation send/accept/cancel:

- Expected server events: `invitation_sent`, `invitation_accepted`, `invitation_canceled`.

1. Role and user admin actions:

- Expected server events: `user_role_changed`, `user_removed`.

1. Retry safety:

- Re-send same Stripe webhook payload.

- Expected: no duplicate canonical event in PostHog.

1. Kill switch:

- Set `POSTHOG_SERVER_ENABLED=false`.

- Expected: zero server events, business flow unaffected.

## Assumptions and Defaults

1. PostHog region is US (`https://us.i.posthog.com`).

2. Supabase Edge Functions are the server integration point.

3. Existing event names remain unchanged (taxonomy stability).

4. Server analytics must never block business-critical flows.

5. Dedupe is required for webhook/session-retry paths.
