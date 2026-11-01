# AI Context PRD (For Coding Assistants)

> Paste this at the start of any AI coding session so the assistant fully understands the system before making changes.

---

## Context

You are working on **InventoryCTRL**, a pre-launch MVP SaaS for SMB inventory management. The key differentiator is **project-based inventory consumption**: companies check out materials from warehouses to active projects/jobs and later export per-project usage reports to bill clients.

### Stack & Versions

- React 18.3 · TypeScript 5.8 · Vite 5.4
- Tailwind CSS 3.4 · shadcn/ui (Radix) · Lucide React icons
- TanStack React Query 5.x · React Router 6.x
- Supabase (Postgres + Auth + RLS + Edge Functions/Deno)
- Stripe (Checkout + Webhooks) · PostHog (optional analytics)
- ExcelJS for report exports · html5-qrcode for scanning
- Deployed: Vercel (frontend) + Supabase (backend)

### Architecture

- **SPA** with `BrowserRouter` — all routes defined in `src/App.tsx`
- **Auth**: `AuthContext` (`src/contexts/AuthContext.tsx`) wraps entire app — provides user, session, profile, role, org name, and all auth/user-management functions
- **Data access**: Custom hooks in `src/hooks/useInventory.ts` (893 lines) — all Supabase queries via TanStack React Query with `queryKey` invalidation patterns
- **Route protection**: `ProtectedRoute` checks auth + subscription status via `get_effective_plan` RPC; `AdminRoute` restricts to admin roles; `WriteAccessRoute` blocks read_only
- **Multi-tenancy**: Organization ID scoped at the DB level via RLS policies; frontend reads org data through `AuthContext.profile.organization_id`
- **Edge Functions** (10 total): `accept-invitation`, `cancel-subscription`, `create-checkout-session`, `delete-user`, `invite-user`, `schedule-subscription-downgrade`, `stripe-webhook`, `sync-checkout-session`, `trial-lifecycle-notifier`, `upgrade-subscription-plan`

### Data Model (Key Tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `organizations` | Tenant root | id, name, subscription_status, trial_ends_at, pending_downgrade_plan |
| `profiles` | Users within org | id, organization_id, role, full_name |
| `items` | Inventory items | item_code (PK), organization_id, description, category, vendor_id, amount, initial_quantity, restock_level, optimal_inventory, unit_value, abc_curve |
| `projects` | Jobs/work orders | project_id, project_name, is_active, organization_id |
| `categories` | Item categories | id, name, organization_id |
| `vendors` | Suppliers | id, name, contact_info, organization_id |
| `transaction_logs` | Audit trail | id, item_code, quantity, transaction_type (checkout/restock), entry_type (added_item/restock/checkout/return), user_id, project_id |
| `subscriptions` | Stripe mirror | org_id, plan, status, stripe_subscription_id, current_period_end |
| `plan_limits` | Entitlement caps | plan, max_users, max_items |
| `organization_invitations` | Pending invites | id, email, role, status, token, expires_at, organization_id |

### User Roles (enforced in DB + frontend)

- `master_admin` — org creator, immutable, full access
- `admin` — full access (manage items, projects, categories, vendors, users, settings, billing)
- `user` — read + write (scan, restock, view dashboard/logs)
- `read_only` — view only (dashboard, logs)

### Subscription Plans (source of truth: `src/lib/planCatalog.ts`)

| Plan | Price | Max Users | Max Items |
|---|---|---|---|
| Trial | Free (14 days) | 5 | 200 |
| Starter | $59.99/mo | 5 | 200 |
| Business | $99.99/mo | 25 | 700 |
| Enterprise | $149.99/mo | Unlimited | Unlimited |

All plans include: unlimited transactions, QR scanning, ABC classification, transaction logs, Excel exports, role management.

### Page Map (14 pages in `src/pages/`)

| Route | Page | Access | Description |
|---|---|---|---|
| `/login` | Login | Public | Sign in, sign up, forgot/reset password, CAPTCHA |
| `/accept-invitation` | AcceptInvitation | Public | Join an org via invitation token |
| `/subscribe` | Subscribe | Auth | Plan selection, trial start, Stripe checkout |
| `/setup` | SetupWizard | Admin | 5-step bulk import wizard (CSV/Excel) |
| `/` | Dashboard | Auth+Sub | Inventory overview, search, QR generation/print |
| `/billing-plan` | BillingPlan | Auth+Sub | Current plan, usage, upgrade/downgrade/cancel |
| `/profile-settings` | ProfileSettings | Auth+Sub | Name edit, password change |
| `/scanner` | Scanner | Write+ | QR/barcode checkout and return scanning |
| `/logs/output` | OutputLogs | Auth+Sub | Checkout/return transaction history |
| `/logs/input` | InputLogs | Auth+Sub | Restock/added-item transaction history |
| `/manage` | Manage | Admin | Full CRUD: items, projects, categories, vendors |
| `/configurations` | Configurations | Admin | ABC thresholds, project label, user management |
| `*` | NotFound | Public | 404 page |

### Key Libraries & Patterns

- **UI components**: `src/components/ui/` — 49 shadcn/ui primitives (do NOT modify these directly)
- **Custom hooks**: `useInventory.ts` — all TanStack Query hooks for items, projects, categories, vendors, transaction logs, settings, batch operations
- **Plan enforcement**: `src/lib/planLimits.ts` — `getPlanLimitsSnapshot()` fetches current usage against plan caps; used by Manage and UserManagement to block additions at limit
- **QR Parser**: `src/lib/qrParser.ts` — parses `Item code: XXX` format, supports custom project labels, backward-compatible with plain barcodes
- **Excel Export**: `src/lib/exportExcel.ts` — 5 export functions (logs, low-stock, dashboard, custom-label, project-items)
- **Analytics**: `src/lib/analytics.ts` — ~30 PostHog events, safe no-op when disabled
- **Marketing/Video Generation**: `remotion-video-prompts.md` contains detailed, UI-accurate specifications for building promotional videos using Remotion.
- **Remotion Videos**: `remotion-video/` contains a complete Remotion project with 6 generated marketing videos (Video1-Video6) showcasing app features

### Important Conventions

- All items are identified by `item_code` (string SKU), NOT auto-incrementing IDs
- Organization scoping is automatic via RLS — no need to pass org_id in most queries
- The "Project" entity has a customizable label (configurable via `organization_settings`)
- Toast notifications use `sonner` (not the shadcn Toaster)
- Password requirements: 10+ characters, 1 uppercase, 1 lowercase, 1 digit

### Pre-Implementation Checklist (for any feature work)

- [ ] Check if the feature touches plan limits (`planLimits.ts`)
- [ ] Check if RLS policies need updating (in `supabase/migrations/`)
- [ ] Check if `useInventory.ts` already has a relevant hook
- [ ] Check if analytics tracking is needed (`analytics.ts`)
- [ ] Check if the feature needs admin vs. write vs. read-only gating
- [ ] Run `npm run build` to confirm no TypeScript errors
- [ ] Run `npm test` to confirm no test regressions

## Key Decisions Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-03-29 | Generated 6 Remotion marketing videos | Created promotional videos using Remotion following the scene breakdowns in `remotion-video-prompts.md`. Videos match actual app UI with proper Tailwind colors (Slate-900 background, Blue-500 primary, ABC classification colors). Videos are 30-60s each covering Hero, Scanner, Dashboard, Team Management, Billing, and Manage workflows. |

## Repo State Notes

- The Remotion marketing video work is currently on branch `codex/add-remotion-marketing-videos`.
- Commit `f3bcc9a` (`Add Remotion marketing video assets`) contains the root-repo Remotion project, generated videos, prompt doc, and handoff/context updates.
- PR #28 targets `main`: `https://github.com/rickadipa/InventoryCtrl/pull/28`
- The `landing_page` directory is a separate git repo/submodule and may have uncommitted changes that are intentionally not part of the root-repo PR unless explicitly committed in that repo and then updated here.
