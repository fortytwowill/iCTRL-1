# PostHog Event Taxonomy

## Naming and schema rules

- Event names use `snake_case`.

- Properties use typed, explicit keys (no untyped bags at call sites).

- Capture always goes through `safeCapture()` in `src/lib/analytics.ts`.

## Server event envelope (Edge Functions)

Server-emitted events include these standardized properties when present:

- `event_source: "server"`

- `runtime: "supabase_edge"`

- `function_name: string`

- `organization_id?: string`

- `actor_user_id?: string`

- `dedupe_key?: string`

## Canonical value sets

- `SubscriptionTier`: `starter | business | enterprise`

- `BillingPeriod`: `monthly | yearly`

- `ScanType`: `input | output`

- `UserRole`: `master_admin | admin | user | read_only`

- `ExportType`: `excel | pdf | csv`

- `LogType`: `input | output`

## Authentication events

### `user_logged_in`

- Optional: `method: string`

### `user_login_failed`

- Optional: `reason: string`

### `user_logged_out`

- No required properties

### `user_signed_up`

- No required properties

## Scanner events

### `scan_started`

- No required properties

### `scan_success`

- Required: `scanType: input | output`

- Required: `itemCount: number`

- Optional: `scanDurationMs: number`

### `scan_failed`

- Required: `errorType: string`

- Optional: `scanType: input | output`

### `scan_type_changed`

- Required: `newType: input | output`

- Required: `previousType: input | output`

### `scan_session_completed`

- Required: `totalItems: number`

- Required: `sessionDurationMs: number`

- Required: `scanType: input | output`

## Wizard events

### `wizard_step_started`

- Required: `step: number`

- Required: `stepName: string`

### `wizard_step_completed`

- Required: `step: number`

- Required: `stepName: string`

### `wizard_abandoned`

- Optional: `lastCompletedStep: number`

- Optional: `totalTimeSpentMs: number`

### `wizard_completed`

- Required: `totalSteps: number`

- Required: `totalTimeSpentMs: number`

## Subscription events

### `subscription_viewed`

- No required properties

### `plan_selected`

- Required: `plan: starter | business | enterprise`

### `checkout_started`

- Required: `plan: starter | business | enterprise`

- Required: `billingPeriod: monthly | yearly`

### `checkout_completed`

- Required: `plan: starter | business | enterprise`

- Required: `billingPeriod: monthly | yearly`

- Required: `amount: number`

- Optional (server): `stripeEventType: string`

### `trial_started`

- Optional: `source: string`

### `trial_converted`

- Optional: `convertedToPlan: starter | business | enterprise`

- Optional (server): `stripeEventType: string`

### `trial_expired`

- Optional: `previousPlan: trial | pending`

### `subscription_canceled`

- Optional: `plan: starter | business | enterprise`

- Optional (server): `stripeEventType: string`

## Billing events

### `billing_plan_viewed`

- Optional: `plan: starter | business | enterprise`

- Optional: `status: string`

### `plan_upgrade_started`

- Required: `fromPlan: starter | business | enterprise`

- Required: `toPlan: starter | business | enterprise`

### `plan_downgrade_scheduled`

- Required: `fromPlan: starter | business | enterprise`

- Required: `toPlan: starter | business | enterprise`

### `plan_cancel_initiated`

- Required: `fromPlan: starter | business | enterprise`

## Inventory events

### `item_created`

- Required: `itemCount: number`

- Required: `hasImage: boolean`

### `item_updated`

- Required: `fieldCount: number`

### `item_deleted`

- Required: `itemCount: number`

### `item_restocked`

- Required: `itemCode: string`

- Required: `quantity: number`

### `category_created`

- No required properties

### `category_updated`

- Required: `categoryId: string`

### `category_deleted`

- Required: `categoryId: string`

### `vendor_created`

- Required: `vendorName: string`

### `vendor_updated`

- Required: `vendorId: string`

### `project_created`

- No required properties

### `project_updated`

- Required: `projectId: string`

### `project_deleted`

- Required: `projectId: string`

### `project_items_exported`

- Required: `projectName: string`

- Required: `itemCount: number`

### `qr_code_generated`

- Recommended: `sourcePage: dashboard | manage`

- Optional: `itemCode: string`

### `bulk_operation`

- Required: `operationType: string`

- Required: `affectedCount: number`

## Logs and reporting events

### `dashboard_viewed`

- Optional: `viewMode: table | grid`

### `logs_viewed`

- Required: `logType: input | output`

### `filter_applied`

- Required: `filterType: string`

- Required: `filterCount: number`

### `search_performed`

- Required: `queryLength: number`

- Optional: `resultCount: number`

### `export_requested`

- Required: `exportType: excel | pdf | csv`

- Required: `recordCount: number`

- Required: `sourcePage: string`

### `date_range_changed`

- Required: `startDate: string` (ISO timestamp)

- Required: `endDate: string` (ISO timestamp)

### `chart_interaction`

- Required: `chartType: string`

- Required: `action: zoom | filter | tooltip | export`

## Organization and team events

### `personnel_added`

- No required properties

### `invitation_sent`

- Required: `role: master_admin | admin | user | read_only`

- Optional (server): `invitationId: string`

- Optional (server): `resent: boolean`

### `invitation_canceled`

- Required: `invitationId: string`

- Optional (server): `role: admin | user | read_only`

### `invitation_accepted`

- Optional: `invitationId: string`

- Optional: `role: master_admin | admin | user | read_only`

### `user_role_changed`

- Required: `targetRole: master_admin | admin | user | read_only`

- Required: `previousRole: master_admin | admin | user | read_only`

- Optional (server): `targetUserId: string`

### `user_removed`

- Required: `targetUserId: string`

## Profile and settings events

### `profile_name_updated`

- No required properties

### `password_changed`

- No required properties

### `password_reset_requested`

- No required properties

### `settings_changed`

- Required: `settingCategory: string`

- Required: `settingKey: string`

## Navigation events

### `$pageview` (PostHog automatic capture)

- Enabled by `capture_pageview: true`.

- Includes PostHog default page properties (for example `$current_url`, `$pathname`, browser/device metadata).

### `$pageleave` (PostHog automatic capture)

- Enabled by `capture_pageleave: true`.

- Used for engagement/session-duration style analysis.
