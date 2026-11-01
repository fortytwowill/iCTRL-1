# PostHog Implementation Reference

## Initialization

- File: `src/lib/analytics.ts`

- Entry point: `initPostHog()` in `src/App.tsx`

- Config:

  - `capture_pageview: true`

  - `capture_pageleave: true`

  - `persistence: "localStorage"`

## Guard behavior

- Analytics runs only when `VITE_POSTHOG_API_KEY` is present and not placeholder.

- Placeholder keys that disable analytics:

  - `""`

  - `phc_example_key`

  - `your_posthog_api_key_here`

- All events are emitted through `safeCapture()` (no direct `posthog.capture()` calls in app code).

## Environment variables

- `VITE_POSTHOG_API_KEY`

- `VITE_POSTHOG_HOST` (defaults to `https://app.posthog.com`)

- `POSTHOG_PROJECT_API_KEY` (Supabase Edge Function secret)

- `POSTHOG_HOST` (Supabase Edge Function secret, defaults to `https://us.i.posthog.com`)

- `POSTHOG_SERVER_ENABLED` (Supabase Edge Function secret kill switch, `true|false`)

## Single entry point pattern

- `posthog-js` is imported only in `src/lib/analytics.ts`.

## Server capture utility

- File: `supabase/functions/_shared/posthog.ts`

- Entry point: `captureServerEvent(...)`

- Behavior:

  - No-op when `POSTHOG_SERVER_ENABLED` is false or key/host are missing

  - Best-effort/non-throwing capture to PostHog `/capture/`

  - 3s timeout protection

  - Standard server properties:

    - `event_source: "server"`

    - `runtime: "supabase_edge"`

    - `function_name`

    - optional `organization_id`

    - optional `actor_user_id`

    - optional `dedupe_key`

    - optional `$groups.organization`

- Dedupe storage:

  - Table: `public.analytics_event_dedupe`

  - Migration: `supabase/migrations/20260705000000_create_analytics_event_dedupe.sql`

## Identity strategy

Implemented in `src/contexts/AuthContext.tsx`:

- `identifyUser(user.id, { email })` on authenticated session

- `setUserProperties({ role, organization_id })` once profile is available

- `resetAnalyticsIdentity()` on sign-out/no-user

Current person properties set:

- `email`

- `role`

- `organization_id`

## Event emission points (client)

### `src/contexts/AuthContext.tsx`

- `user_logged_in`

- `user_login_failed`

- `user_logged_out`

- `user_signed_up`

### `src/components/UserManagement.tsx`

- `personnel_added`

- `invitation_sent`

- `invitation_canceled`

### `src/pages/Subscribe.tsx`

- `subscription_viewed`

- `plan_selected`

- `checkout_started`

- `checkout_completed`

- `trial_started`

- `trial_converted`

- `trial_expired`

### `src/pages/BillingPlan.tsx`

- `billing_plan_viewed`

- `plan_upgrade_started`

- `plan_downgrade_scheduled`

- `plan_cancel_initiated`

- `subscription_canceled`

### `src/pages/Scanner.tsx`

- `scan_started` (via `BarcodeScanner` camera activation callback)

- `scan_type_changed`

- `scan_success`

- `scan_failed`

- `scan_session_completed`

### `src/pages/SetupWizard.tsx`

- `wizard_step_started`

- `wizard_step_completed`

- `wizard_abandoned`

- `wizard_completed`

- `item_created`

### `src/pages/Dashboard.tsx`

- `dashboard_viewed`

- `search_performed`

- `filter_applied`

- `export_requested`

- `bulk_operation`

- `qr_code_generated`

- `chart_interaction`

### `src/pages/Manage.tsx`

- `search_performed`

- `item_updated`

- `item_deleted`

- `item_restocked`

- `category_created`

- `category_updated`

- `category_deleted`

- `project_created`

- `project_updated`

- `project_deleted`

- `project_items_exported`

- `vendor_created`

- `vendor_updated`

- `qr_code_generated`

- `export_requested`

### `src/pages/InputLogs.tsx`

- `logs_viewed`

- `filter_applied`

- `date_range_changed`

- `export_requested`

### `src/pages/OutputLogs.tsx`

- `logs_viewed`

- `filter_applied`

- `date_range_changed`

- `export_requested`

### `src/pages/Configurations.tsx`

- `settings_changed`

### `src/pages/ProfileSettings.tsx`

- `profile_name_updated`

- `password_changed`

### `src/pages/Login.tsx`

- `password_reset_requested`

### `src/pages/AcceptInvitation.tsx`

- `invitation_accepted`

## Event emission points (server / Supabase Edge Functions)

### `supabase/functions/sync-checkout-session/index.ts`

- `checkout_completed`

- `trial_converted`

### `supabase/functions/stripe-webhook/index.ts`

- `checkout_completed`

- `trial_converted`

- `subscription_canceled`

### `supabase/functions/trial-lifecycle-notifier/index.ts`

- `trial_expired`

### `supabase/functions/invite-user/index.ts`

- `invitation_sent`

### `supabase/functions/accept-invitation/index.ts`

- `invitation_accepted`

### `supabase/functions/cancel-invitation/index.ts`

- `invitation_canceled`

### `supabase/functions/update-user-role/index.ts`

- `user_role_changed`

### `supabase/functions/delete-user/index.ts`

- `user_removed`

### `supabase/functions/upgrade-subscription-plan/index.ts`

- `plan_upgrade_started`

### `supabase/functions/schedule-subscription-downgrade/index.ts`

- `plan_downgrade_scheduled`

### `supabase/functions/cancel-subscription/index.ts`

- `subscription_canceled`

## Ownership notes

- Canonical server-owned events now emit from Edge Functions with `event_source: "server"`.

- Some equivalent client-side events still exist during rollout for continuity; filter by `event_source = server` for backend-truth reporting.

## Declared but unused helpers

- None. All helpers exported in `src/lib/analytics.ts` are wired into UI flows.
