# PostHog Validation Runbook

## Scope

Regression/manual validation for analytics instrumentation across auth, billing, scanner, wizard, inventory management, logs, team, and profile flows.

## Preconditions

- `VITE_POSTHOG_API_KEY` is set to a valid non-placeholder key.

- App can reach `VITE_POSTHOG_HOST`.

- Supabase function secrets are configured:

  - `POSTHOG_PROJECT_API_KEY`

  - `POSTHOG_HOST=https://us.i.posthog.com`

  - `POSTHOG_SERVER_ENABLED=true`

- Browser DevTools Network tab open (filter by `/e` requests).

- PostHog Live Events open for real-time event inspection.

## Global checks

1. Confirm event names are snake_case.

2. Confirm required properties match `docs/reference/posthog-event-taxonomy.md`.

3. Confirm no duplicate event spam for a single user action.

4. Confirm no events fire when API key is missing/placeholder.

5. For server-owned canonical events, confirm `event_source=server` and `function_name` are present.

## Flow scripts

### 1. Authentication and password reset

Steps:

1. Attempt sign-in with invalid credentials.

2. Sign in successfully.

3. Sign out.

4. Trigger forgot-password flow from `/login`.

Expected events:

- `user_login_failed`

- `user_logged_in`

- `user_logged_out`

- `password_reset_requested`

### 2. Invitation and organization management

Steps:

1. In Configurations → Users, send invitation.

2. Cancel a pending invitation.

3. Change an existing user role.

4. Remove a user.

5. Complete invite acceptance in `/accept-invitation`.

Expected events:

- `personnel_added`

- `invitation_sent` (server canonical from `invite-user`)

- `invitation_canceled` (server canonical from `cancel-invitation`)

- `user_role_changed` (server canonical from `update-user-role`)

- `user_removed` (server canonical from `delete-user`)

- `invitation_accepted` (server canonical from `accept-invitation`)

### 3. Subscription and billing

Steps:

1. Open `/subscribe`.

2. Select plan.

3. Start checkout.

4. Return from successful Stripe checkout redirect.

5. Start trial (if account is pending).

6. In `/billing-plan`, trigger upgrade.

7. Schedule downgrade.

8. Cancel at period end.

Expected events:

- `subscription_viewed`

- `plan_selected`

- `checkout_started`

- `checkout_completed` (server canonical from `sync-checkout-session`/`stripe-webhook`)

- `trial_started`

- `trial_converted` (server canonical; only when trial -> paid transition happens)

- `trial_expired` (server canonical from `trial-lifecycle-notifier` when status transitions)

- `billing_plan_viewed`

- `plan_upgrade_started` (server canonical from `upgrade-subscription-plan`)

- `plan_downgrade_scheduled` (server canonical from `schedule-subscription-downgrade`)

- `plan_cancel_initiated`

- `subscription_canceled` (server canonical from `cancel-subscription`/`stripe-webhook`)

### 10. Server dedupe and kill switch

Steps:

1. Re-send the same Stripe webhook payload (or replay from Stripe dashboard).

2. Trigger `sync-checkout-session` twice with the same checkout session id.

3. Set `POSTHOG_SERVER_ENABLED=false` in Supabase function secrets and re-run one billing/invitation flow.

Expected events:

- No duplicate canonical server event for identical webhook/session retries.

- With kill switch off, no server events are sent, but business actions still succeed.

### 4. Scanner

Steps:

1. Open scanner and allow camera.

2. Switch between Checkout and Return modes.

3. Execute successful scan.

4. Execute failure scan (unknown or out-of-stock).

5. Complete checkout session.

Expected events:

- `scan_started`

- `scan_type_changed`

- `scan_success`

- `scan_failed`

- `scan_session_completed`

### 5. Setup wizard

Steps:

1. Open wizard and move through steps.

2. Complete import flow.

3. Repeat and leave wizard before completion (navigate away or refresh).

Expected events:

- `wizard_step_started`

- `wizard_step_completed`

- `wizard_completed`

- `item_created`

- `wizard_abandoned`

### 6. Dashboard

Steps:

1. Open dashboard.

2. Use search (pause 300ms+).

3. Apply filters (category/ABC/stock).

4. Toggle grid/table view.

5. Open QR dialog for an item.

6. Use Bulk QR print.

7. Export dashboard data.

Expected events:

- `dashboard_viewed` (once per browser session)

- `search_performed`

- `filter_applied`

- `chart_interaction`

- `qr_code_generated`

- `bulk_operation`

- `export_requested`

### 7. Manage page CRUD + exports

Steps:

1. Search items (pause 300ms+).

2. Update item.

3. Delete item.

4. Restock item.

5. Create/update/delete category.

6. Create/update/delete project.

7. Create/update vendor.

8. Open item QR dialog.

9. Export project items.

Expected events:

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

- `vendor_created`

- `vendor_updated`

- `qr_code_generated`

- `project_items_exported`

- `export_requested`

### 8. Logs pages

Steps:

1. Open `/logs/input` and `/logs/output`.

2. Apply filters.

3. Change month/year filters.

4. Export logs.

Expected events:

- `logs_viewed` (once per session per log page type)

- `filter_applied`

- `date_range_changed`

- `export_requested`

### 9. Profile/settings

Steps:

1. Save ABC thresholds in Configurations.

2. Save project label in Configurations.

3. Update profile name in Profile Settings.

4. Change password in Profile Settings.

Expected events:

- `settings_changed`

- `profile_name_updated`

- `password_changed`

## Disabled analytics validation

1. Set `VITE_POSTHOG_API_KEY` to empty/placeholder value.

2. Reload app and repeat a few actions (login, dashboard search, export).

3. Confirm no PostHog `/e` requests are emitted.

Expected:

- Zero analytics requests.

- App behavior otherwise unchanged.
