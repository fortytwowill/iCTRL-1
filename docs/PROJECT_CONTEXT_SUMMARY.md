# Project Context Summary

## Overview

InventoryCTRL is a multi-tenant inventory management SaaS for trade and field-service businesses that consume warehouse materials on projects or jobs. Its main differentiator is project-based inventory tracking: users check materials out to projects, record returns, review transaction history, and export per-project usage for billing and operational control.

This repository contains:

- A React + TypeScript + Vite frontend SPA
- A Supabase backend using Postgres, Auth, RLS, RPCs, and Edge Functions
- Stripe billing integration
- Optional PostHog analytics
- A separate static marketing landing page

## Current Stack

- Frontend: React 18, TypeScript 5, Vite 5, React Router 6
- State/data: TanStack React Query
- UI: Tailwind CSS, shadcn/ui, Radix, Lucide
- Backend: Supabase Postgres + Auth + Edge Functions
- Billing: Stripe Checkout + webhooks
- Analytics: PostHog
- Exports/imports: ExcelJS
- Scanning: `html5-qrcode`

## Repo Structure

- `src/`: application frontend
- `supabase/functions/`: Edge Functions
- `supabase/migrations/`: database schema and behavior history
- `docs/`: product, architecture, deployment, billing, analytics, and ops docs
- `landing_page/`: separate static marketing website
- `public/`, `Images/`: assets and screenshots

## Frontend Architecture

### App shell

- Routing is defined in `src/App.tsx`
- The entire app is wrapped by `AuthProvider`
- Query caching is handled through a single `QueryClient`
- Theme support uses `next-themes` with a three-mode toggle (system/light/dark); the app defaults to system mode

### Auth and user state

`src/contexts/AuthContext.tsx` is the core application context. It manages:

- current user and Supabase session
- profile and organization lookup
- invitation completion state
- auth flows: sign in, sign up, sign out, password reset/change
- org user management actions
- invitation actions
- session refresh/retry behavior for Edge Function calls

### Route protection

`src/components/ProtectedRoute.tsx` enforces:

- authentication
- subscription access through `get_effective_plan`
- invitation-completion redirects
- admin-only routes
- write-access restrictions for `read_only`
- billing access rules

Billing access is intentionally narrow:

- `/billing-plan` is effectively `master_admin` only
- `/subscribe` is mainly for `master_admin`, with a preserved recovery exception for a `read_only` billing owner after expiry/cancellation

### Data access layer

`src/hooks/useInventory.ts` is the main frontend data layer. It contains hooks for:

- items
- projects
- categories
- vendors
- settings and custom project label
- transaction logs
- checkout/return flows
- transaction log editing

This file is one of the main complexity centers in the frontend.

## Product Surface

The implemented application pages are:

- `Login`: sign in, sign up, password reset, lockout/CAPTCHA flow
- `AcceptInvitation`: complete invitation acceptance and account setup
- `Subscribe`: trial start and Stripe checkout flow
- `BillingPlan`: billing overview, upgrade, downgrade, cancellation
- `Dashboard`: searchable inventory view with QR generation/export
- `Scanner`: checkout and return flows using camera/manual entry
- `OutputLogs`: checkout/return history
- `InputLogs`: restock/added-item/return history
- `Manage`: CRUD for items, projects, categories, vendors
- `Configurations`: ABC thresholds, custom project label, user management
- `ProfileSettings`: display name and password management
- `SetupWizard`: CSV/XLSX inventory import wizard

## Key Business Rules

- Inventory items are keyed by `item_code`, not a numeric id
- The app is organization-scoped through Supabase RLS
- Active roles are:
  - `master_admin`
  - `admin`
  - `user`
  - `read_only`
- `master_admin` is the main billing authority
- Plan limits apply to both users and inventory items
- Pending invitations count toward seat limits
- Projects can be relabeled per organization, for example "Job" or "Work Order"
- Password policy is 10+ characters with uppercase, lowercase, and digit requirements

## Main User Workflows

### Inventory management

Admins can create and maintain:

- items
- categories
- projects
- vendors

The dashboard exposes stock visibility, filters, QR generation, and spreadsheet export.

### Scanner workflow

The scanner supports:

- checkout mode
- return mode
- camera scanning and manual entry
- batch checkout
- duplicate scan cooldown
- success/error audio feedback

### Transaction logs

Logs are split into:

- output logs for checkout/return activity
- input logs for added-item/restock/return activity

Admins can edit transaction logs through a dialog backed by a reconciliation RPC.

### Setup/import workflow

The setup wizard is implemented and supports:

- CSV/XLSX file upload
- auto-detected column mapping
- SKU generation
- ABC auto-calculation
- preview with row validation
- batch item import with plan-limit checks

### Billing workflow

Billing flows are built around:

- Stripe Checkout session creation
- webhook-driven subscription sync
- explicit session sync after Stripe redirect
- immediate upgrades
- scheduled downgrades
- cancel-at-period-end

## Backend Architecture

### Supabase database

The database evolved from a simpler inventory tracker into a multi-tenant SaaS backend with:

- organizations
- profiles and roles
- items
- projects
- categories
- vendors
- transaction logs
- settings
- subscriptions
- plan limits
- organization invitations

The migration history shows repeated hardening around:

- RLS
- invitation flow correctness
- subscription determinism
- billing owner continuity
- plan enforcement
- transaction log editing
- invitation reconciliation

### Important RPCs and DB logic

Key backend logic is enforced in the database through RPCs/functions such as:

- `get_effective_plan`
- `get_org_subscription`
- `get_limit_enforcement_plan`
- `checkout_item`
- `checkout_items_batch`
- `return_item`
- `update_transaction_log`
- `get_organization_users`
- `get_organization_invitations`
- `invite_user`

There are also DB triggers enforcing plan limits for item and profile creation.

## Edge Functions

The repository currently contains these function directories:

- `accept-invitation`
- `cancel-invitation`
- `cancel-subscription`
- `create-checkout-session`
- `delete-user`
- `invite-user`
- `schedule-subscription-downgrade`
- `stripe-webhook`
- `sync-checkout-session`
- `trial-lifecycle-notifier`
- `update-user-role`
- `upgrade-subscription-plan`

Common themes across these functions:

- careful auth validation
- JWT refresh/retry tolerance on the frontend
- Stripe state synchronization
- invitation lifecycle handling
- PostHog server-side event capture

Membership-management functions are intentionally expected to run with gateway JWT verification disabled and instead authenticate inside the function handler.

## Analytics

Analytics is optional and guarded when keys are missing.

Client analytics lives in `src/lib/analytics.ts` and captures:

- auth events
- scanner events
- billing/subscription events
- dashboard/search/filter/export events
- manage/configuration/profile events

Server analytics lives in `supabase/functions/_shared/posthog.ts` and is used by billing and invitation-related Edge Functions. The repo also includes a DB table for analytics dedupe.

## Exports and Reporting

`src/lib/exportExcel.ts` provides spreadsheet exports for:

- logs
- low-stock reporting
- dashboard inventory
- custom-label exports
- project item usage exports

Project item export is implemented in code and summarizes checkout vs return activity per item for a selected project.

## UI Notes

The app uses shadcn/ui primitives and a custom industrial visual style with classes such as:

- `industrial-grid`
- `glass-card`
- `gradient-text`
- scanner-specific animation helpers

The landing page is a separate static experience and not part of the React app runtime.

## Known Documentation Drift

Some documentation is behind the codebase:

- `docs/PRD.md` still says Setup Wizard is "not implemented yet", but it is implemented
- `docs/PRD.md` also says Project Items Export is "not implemented yet", but it is implemented
- some docs refer to 10 Edge Functions, while the repo currently contains 12 function directories plus `_shared`

## Repo Health Snapshot

At the time of review:

- `npm test` passes
- `npm run build` passes

Current notable build characteristic:

- the production JS bundle is large and Vite emits a chunk-size warning, so future code-splitting may be worthwhile

## Practical Mental Model

The easiest way to think about this project is:

1. The frontend is a role-gated inventory SPA.
2. Supabase is the real source of truth for org scoping, permissions, plan enforcement, and transaction integrity.
3. Stripe controls paid subscription state, but the app synchronizes that state into Supabase and gates access from there.
4. Invitations and billing ownership are sensitive areas and have already gone through multiple rounds of hardening.
5. The highest-complexity files are:
   - `src/contexts/AuthContext.tsx`
   - `src/hooks/useInventory.ts`
   - `src/pages/Manage.tsx`
   - `src/pages/Dashboard.tsx`
   - `src/pages/Scanner.tsx`
   - `src/pages/SetupWizard.tsx`
   - the Stripe and invitation Edge Functions

## Summary

This is a real MVP SaaS codebase with substantial product surface, not a thin prototype. The core architectural concerns are:

- multi-tenant data isolation
- role-aware UI and backend authorization
- inventory transaction correctness
- billing and plan enforcement
- invitation lifecycle correctness
- operational analytics and deployment documentation

The codebase is strong enough to support ongoing feature work, but future changes should account for existing complexity around auth, billing, and database-driven business rules.
