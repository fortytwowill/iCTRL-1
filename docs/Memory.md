# Memory — Invitation System Redesign (March 2026)

## What Was Done

The organization user invitation system was completely **rewritten from scratch**, simplifying an over-engineered implementation into a clean, predictable flow.

See `JWT Guardrails Lock (March 7, 2026)` for mandatory deploy/auth rules.

### Files Rewritten

| File | Before | After | Purpose |

|---|---|---|---|

| `supabase/functions/invite-user/index.ts` | 377 lines | ~170 lines | Creates invitation record + sends auth email |

| `supabase/functions/accept-invitation/index.ts` | 497 lines + 2 helpers | ~260 lines | Validates invitation + creates profile |

| `src/pages/AcceptInvitation.tsx` | 804 lines | ~320 lines | Accept invitation UI page |

### Files Deleted (9 total)

| File | Reason |

|---|---|

| `supabase/functions/accept-invitation/ownerRepair.ts` | Removed reconciliation logic |

| `supabase/functions/accept-invitation/invitationMetadata.ts` | Removed metadata helpers |

| `supabase/functions/send-invitation/index.ts` | Redundant edge function (unused by frontend) |

| `src/lib/acceptInvitationState.ts` | Old helper, logic inlined |

| `src/lib/invitationSession.ts` | Old helper, no longer needed |

| `src/test/acceptInvitationState.test.ts` | Tests for deleted helper |

| `src/test/invitationSession.test.ts` | Tests for deleted helper |

| `src/test/invitationMetadata.test.ts` | Tests for deleted helper |

| `src/test/invitationOwnerRepair.test.ts` | Tests for deleted helper |

### Files NOT Changed

- `src/components/UserManagement.tsx` — Invite dialog and pending list (unchanged)

- `src/contexts/AuthContext.tsx` — `inviteUser`, `fetchOrganizationInvitations`, `deleteInvitation` methods (unchanged)

- Database RPCs: `invite_user`, `get_organization_invitations`, `delete_invitation` (unchanged)

- `organization_invitations` table schema (unchanged)

---

## Key Architecture Decisions

### Invitation Flow

```text
Master Admin → UserManagement.tsx → AuthContext.inviteUser()
  → invokeEdgeFunction("invite-user", { email, role })
    → invite_user RPC (creates DB record + token, checks plan limits)
    → supabaseAdmin.auth.admin.inviteUserByEmail() (sends email with redirect URL)
```

```text
Invited User clicks email link → /accept-invitation?token=xxx#access_token=...
  → AcceptInvitation.tsx extracts hash tokens, sets session
  → Calls accept-invitation edge function with preview: true (gets org name, role, inviter name)
  → User fills form (name + password)
  → supabase.auth.updateUser({ password }) (sets password)
  → Calls accept-invitation edge function (creates/updates profile, marks invitation accepted)
  → refreshProfile() → redirect to dashboard
```

### Edge Function JWT Configuration

> **CRITICAL**: Membership-management functions must be deployed with `verify_jwt: false`:
> `invite-user`, `accept-invitation`, `delete-user`, `cancel-invitation`, `update-user-role`.

The Supabase gateway's built-in JWT verification was rejecting valid user tokens (returning 401 "Invalid JWT" before our code ran). These functions verify auth **inside the code** via `userClient.auth.getUser()`, so they remain secure.

This was a pre-existing issue since v37 of `invite-user`. Setting `verify_jwt: false` bypasses the gateway check while keeping in-code auth verification.

### SITE_URL

The `invite-user` edge function uses `Deno.env.get("SITE_URL")` with a fallback to `https://ictrl.app` to build the redirect URL in invitation emails. If the deployment URL changes, update the `SITE_URL` env var in Supabase Edge Function secrets.

---

## Key Database Details

### `organization_invitations` table

- `id` (UUID, PK), `organization_id`, `invited_by`, `email`, `token`, `role`, `status` (`pending`/`accepted`/`expired`), `expires_at`, `created_at`, `updated_at`

- Token is generated as `md5(random + clock_timestamp + uid + email) || md5(txid + random + email)`

- Invitations expire after **7 days**

### `invite_user` RPC

- Validates role (`admin`, `user`, `read_only` — never `master_admin`)

- Checks caller is `master_admin`

- Enforces plan user limits (confirmed users + pending invites vs `plan_limits.max_users`)

- Expires/accepts stale invitations for the same email before creating a new one

- Returns `{invitation_id, token}`

### `get_organization_invitations` RPC

- Returns pending invitations for the caller's organization

- Excludes invitations where the user has already been confirmed (email_confirmed_at IS NOT NULL)

- Joins with `profiles` to get `invited_by_name`

### `delete_invitation` RPC

- Takes `p_invitation_id`, deletes the invitation (used for cancellation)

---

## Frontend Architecture

### `AuthContext.tsx` (unchanged but important)

- `invokeEdgeFunction<T>(name, body)` — defined at top of file (not exported). Handles session refresh + retry on 401.

- `inviteUser(email, role)` — calls `invokeEdgeFunction("invite-user", ...)`, parses errors into user-friendly messages.

- `fetchOrganizationInvitations()` — calls `get_organization_invitations` RPC.

- `deleteInvitation(invitationId)` — calls `delete_invitation` RPC.

- `requiresInvitationCompletion` / `pendingInvitationToken` — state flags checked via `syncInvitationCompletionState()`.

### `AcceptInvitation.tsx` (rewritten)

- **States**: `loading` → `form` → `submitting` → `success` → redirect, or `error`

- Shows read-only info card: inviter name, organization name, role

- Password validation: 10+ chars, 1 uppercase, 1 lowercase, 1 digit

- Real-time password match indicator (green ✓ / red ✗) below confirm password field

- On submit: set password → call accept-invitation → refreshProfile → navigate to `/`

### `UserManagement.tsx` (unchanged)

- Invite dialog: email + role selector (`admin`, `user (can checkout items)`, `read_only`)

- Pending invitations list with cancel button

- Handles plan limit display and enforcement

---

## Supabase Project

- **Project ID**: `katrzxlydbvuabyhuliq`

- **URL**: `https://katrzxlydbvuabyhuliq.supabase.co`

- **Deployed URL**: `https://ictrl.app`

- **Anon Key**: Standard JWT key set in `.env` as `VITE_SUPABASE_ANON_KEY`

- **Publishable Key**: `sb_publishable_...` format set as `VITE_SUPABASE_PUBLISHABLE_KEY`

- Client prefers anon key over publishable key (see `src/integrations/supabase/client.ts`)

### Edge Functions Deployed

| Function | Version | verify_jwt | Status |

|---|---|---|---|

| `invite-user` | v39 | `false` | Active |

| `accept-invitation` | v14 | `false` | Active |

| `delete-user` | v17 | `false` | Active |

| `cancel-invitation` | v1 | `false` | Active |

| `update-user-role` | v1 | `false` | Active |

| `send-invitation` | — | — | Source deleted, still deployed on Supabase |

---

## Lessons Learned

1. **Supabase `verify_jwt` gateway check** can fail even with valid user JWTs. When this happens, set `verify_jwt: false` and handle auth inside the function code. The in-code `userClient.auth.getUser()` call is equally secure.

1. **`send-invitation` was a dead/duplicate function** — the frontend only ever called `invite-user`. Source was deleted but the function remains deployed on Supabase (harmless).

1. **The old system had excessive recovery logic** (owner repair, reconciliation loops, provisional orgs, multi-step session recovery). None of this was necessary — a clean linear flow handles all cases.

1. **Password requirements**: 10 characters minimum, at least one uppercase letter, one lowercase letter, and one digit. These are enforced both client-side (AcceptInvitation.tsx, AuthContext.changePassword) and could be enforced server-side if needed.

1. **The `invite_user` RPC handles plan limits** — no need to duplicate this check in the edge function. The RPC raises an exception with the message `Plan user limit reached (X users). Upgrade your plan to invite more users.`

---

## Memory — Master Admin Billing Restrictions (March 2026)

### Goal for PostHog Rollout

Restrict normal billing UI/access to `master_admin` while preserving the recovery exception for a former billing owner to re-subscribe after plan end.

### Final Behavior

- `Billing & Plan` (`/billing-plan`) is **master_admin only**.

- Non-master roles (`admin`, `user`, `read_only`) do **not** see Billing & Plan nav/buttons.

- Non-master direct access to `/billing-plan` redirects to `/`.

- `/subscribe` remains available for:

  - `master_admin`

  - preserved recovery exception user only.

### Preserved Recovery Exception (kept as-is)

A user can access subscribe recovery only when all are true:

- `role === "read_only"`

- `organization.billing_owner_user_id === user.id`

- `organization.subscription_status` is `canceled` or `expired`

This exception does **not** grant access to `/billing-plan`, only to `/subscribe` recovery flow.

### Redirect Rules

- `pending` plan state:

  - allowed billing user -> `/subscribe`

  - other non-master users -> `/login?subscription=pending`

- `expired` plan state:

  - allowed billing user -> `/subscribe`

  - other non-master users -> `/login?trial=expired`

### Files Involved (Frontend)

- `src/lib/billingAccess.ts`

  - centralized helpers for billing-plan visibility/access and subscribe exception checks.

- `src/components/ProtectedRoute.tsx`

  - `MasterAdminBillingRoute` for `/billing-plan`

  - `BillingSubscribeRoute` for `/subscribe`

  - pending/expired redirects made role-aware with exception support.

- `src/App.tsx`

  - `/billing-plan` wrapped with `MasterAdminBillingRoute`

  - `/subscribe` wrapped with `BillingSubscribeRoute`

- `src/components/layout/AppLayout.tsx`

  - Billing nav hidden for non-master roles

  - billing banner CTA links shown only for `master_admin`

- `src/pages/Login.tsx`

  - expired/pending messaging updated for non-master users

  - no broad billing CTA exposure for non-master users

- `src/pages/BillingPlan.tsx`

  - non-master warning banners removed as page is now route-protected.

### Backend Exception Status

No exception tightening was applied. Existing recovery exception logic was intentionally preserved in:

- `supabase/functions/create-checkout-session/index.ts`

- `supabase/functions/sync-checkout-session/index.ts`

### Notes

- No schema/migration changes required.

- No changes to unrelated features (inventory/logs/settings/invites).

---

## Memory — PostHog Server Analytics Rollout (March 6, 2026)

### Goal

Connect Supabase Edge Functions to PostHog for server-authoritative analytics events, while keeping existing client analytics intact during rollout.

### What Was Implemented

#### Shared Server Analytics Utility

- Added `supabase/functions/_shared/posthog.ts`

- Added `captureServerEvent(...)` with:

  - env guard (`POSTHOG_SERVER_ENABLED`, `POSTHOG_PROJECT_API_KEY`, `POSTHOG_HOST`)

  - standardized server properties:

    - `event_source: "server"`

    - `runtime: "supabase_edge"`

    - `function_name`

    - optional `organization_id`, `actor_user_id`, `dedupe_key`, `$groups.organization`

  - timeout-protected, best-effort non-throwing capture to PostHog `/capture/`

#### Dedupe Storage

- Added migration: `supabase/migrations/20260705000000_create_analytics_event_dedupe.sql`

- Creates `public.analytics_event_dedupe` with:

  - `dedupe_key text primary key`

  - `created_at timestamptz default now()`

- RLS enabled and anon/authenticated revoked.

#### Edge Functions Instrumented (Server Events)

- `sync-checkout-session`: `checkout_completed`, `trial_converted`

- `stripe-webhook`: `checkout_completed`, `trial_converted`, `subscription_canceled`

- `trial-lifecycle-notifier`: `trial_expired`

- `invite-user`: `invitation_sent`

- `accept-invitation`: `invitation_accepted`

- `delete-user`: `user_removed`

- `upgrade-subscription-plan`: `plan_upgrade_started`

- `schedule-subscription-downgrade`: `plan_downgrade_scheduled`

- `cancel-subscription`: `subscription_canceled`

#### New Edge Wrappers Added

- `supabase/functions/update-user-role/index.ts`

  - wraps `update_user_role` RPC

  - emits `user_role_changed`

- `supabase/functions/cancel-invitation/index.ts`

  - wraps `delete_invitation` RPC

  - emits `invitation_canceled`

#### Frontend Integration Update

- Updated `src/contexts/AuthContext.tsx`:

  - `updateUserRole(...)` now calls edge function `update-user-role` (not direct RPC)

  - `deleteInvitation(...)` now calls edge function `cancel-invitation` (not direct RPC)

  - removed client-side emission for `user_role_changed` and `user_removed` from AuthContext path

#### Documentation Synced

- Updated:

  - `docs/reference/posthog-implementation.md`

  - `docs/reference/posthog-event-taxonomy.md`

  - `docs/runbooks/posthog-validation.md`

- Added server emission points, server property envelope, dedupe/kill-switch checks, and updated QA expectations.

### Remote Supabase Changes Applied

#### Secrets Set

- `POSTHOG_PROJECT_API_KEY`

- `POSTHOG_HOST=https://us.i.posthog.com`

- `POSTHOG_SERVER_ENABLED=true`

#### Migration Applied

- `20260705000000_create_analytics_event_dedupe.sql` pushed to remote

- Confirmed `Local == Remote` in `npx supabase migration list`

#### Functions Deployed

- `stripe-webhook` (v12)

- `sync-checkout-session` (v5)

- `trial-lifecycle-notifier` (v1)

- `invite-user` (v42)

- `accept-invitation` (v17)

- `delete-user` (v20)

- `upgrade-subscription-plan` (v5)

- `schedule-subscription-downgrade` (v4)

- `cancel-subscription` (v4)

- `update-user-role` (v1)

- `cancel-invitation` (v1)

### Validation Status

- Local app checks:

  - `npm run build` passed

  - `npm test` passed (required elevated run due sandbox `spawn EPERM`)

- Remote checks:

  - PostHog secrets present in Supabase (`supabase secrets list`)

  - new functions active in Supabase (`supabase functions list`)

- Manual PostHog UI verification still required:

  - filter Live Events by `event_source = "server"`

  - trigger canonical flows and confirm expected event names/properties

  - replay one Stripe webhook/session retry and confirm dedupe behavior

---

## Memory — JWT Guardrails Lock (March 7, 2026)

### Why this exists

This lock exists because invitation and user-management regressions reappeared when function redeploys omitted explicit JWT gateway configuration. These rules are mandatory for all future membership-auth changes.

### Locked Invariants

- `invite-user`, `accept-invitation`, `delete-user`, `cancel-invitation`, `update-user-role`, and `accept-platform-terms` must run with `verify_jwt = false`.

- Each of those functions must authenticate requests in-code via `userClient.auth.getUser()`.

- Frontend membership actions must use session refresh/retry wrappers (no fragile direct invoke path for user removal).

### Exact Deploy Commands (copy/paste)

```bash
supabase functions deploy invite-user --no-verify-jwt
supabase functions deploy accept-invitation --no-verify-jwt
supabase functions deploy delete-user --no-verify-jwt
supabase functions deploy cancel-invitation --no-verify-jwt
supabase functions deploy update-user-role --no-verify-jwt
```

### Post-Deploy Verification

1. Run:

```bash
npx supabase functions list
```

1. Expected minimum versions:

   - `invite-user` `v43`

   - `accept-invitation` `v18`

   - `delete-user` `v21`

   - `cancel-invitation` `v2`

   - `update-user-role` `v2`

1. Run an invalid-token probe against the five membership functions.

1. Expected response behavior:

   - Response body comes from function code, e.g. `{"success":false,"code":"unauthorized",...}`.

   - Response must **not** be a gateway-level `"Invalid JWT"` error.

### Drift Prevention Checklist

- If any of the five membership functions are touched, redeploy with `--no-verify-jwt`.

- If frontend auth invocation paths are changed, verify refresh/retry behavior before release.

- After every related deploy, update this lock section with the new versions and deployment date.
