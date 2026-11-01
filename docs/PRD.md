# InventoryCTRL — Product Requirements Document

> **Version**: 1.0 · **Status**: Pre-Launch MVP · **Last Updated**: March 2026

---

## 1. Executive Summary

InventoryCTRL is a multi-tenant SaaS inventory management platform built for small and medium businesses that consume warehouse materials during project execution — not direct retail sales. Organizations create a centralized inventory, check out items to active projects or jobs via QR/barcode scanning, track every transaction in a full audit trail, and export per-project consumption reports that detail exactly which materials were used, returned, and their associated costs — enabling accurate client billing for materials consumed during work.

---

## 2. Problem Statement

Construction firms, maintenance companies, field-service businesses, and similar SMBs share a common operational pattern: they purchase materials in bulk, store them in a warehouse, and deploy those materials across multiple active projects. At the end of each project they need to know **exactly** what was consumed and at what cost so they can bill their clients accurately.

Existing inventory tools — inFlow Inventory, Zoho Inventory, Cin7, Fishbowl, and NetSuite — are built around traditional retail or manufacturing workflows: purchase orders, sales orders, and direct point-of-sale transactions. They assume inventory leaves the warehouse as a **sale** to an external customer.

**None of these tools natively support the "check-out to project → track consumption → bill client" workflow.** This forces SMBs into manual spreadsheets, error-prone workarounds, or expensive ERP customizations that don't fit their scale or budget.

InventoryCTRL solves this by making **project-based inventory consumption** the core primitive — not an afterthought.

---

## 3. Target Audience

### Primary Persona: Operations / Warehouse Manager

- **Company type**: SMBs with 5–100 employees in construction, maintenance, field services, HVAC, electrical, plumbing, landscaping, or any trade/service business that allocates materials to jobs.

- **Pain point**: Restock before running out of critical materials, tracking which materials went to which job, how much was used vs. returned, and generating accurate cost reports for client invoicing.

- **Current workflow**: Spreadsheets, paper logs, or generic inventory tools that require manual reconciliation.

- **Decision criteria**: Affordable monthly pricing, fast onboarding (bulk import), mobile-friendly scanning for warehouse use, and exportable reports for accounting/billing.

### Secondary Personas

- **Company owner/founder** — Evaluates subscription, oversees billing, wants visibility into inventory costs per project.

- **Warehouse staff** — Day-to-day users who scan items in/out; need a fast, reliable mobile scanning experience.

---

## 4. Core Feature Set

### 4.1 Authentication & Multi-Tenancy

| Capability | Detail |

|---|---|

| Auth provider | Supabase Auth (email + password) |

| Data isolation | Organization-scoped via Supabase Row-Level Security (RLS) on all domain tables |

| Brute-force protection | Math CAPTCHA after 3 failed login attempts; full lockout after 5 attempts (30-second cooldown) |

| Password recovery | Forgot-password email flow; in-app reset-password form |

| Sign-up | New user creates an account **and** a new organization in one step |

### 4.2 User Roles & Permissions

Four active roles enforce access throughout the application:

| Role | Manage Entities | Scan / Restock | View Dashboard & Logs | Manage Users | Manage Billing |

|---|---|---|---|---|---|

| `master_admin` | ✅ | ✅ | ✅ | ✅ | ✅ |

| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ |

| `user` | ❌ | ✅ | ✅ | ❌ | ❌ |

| `read_only` | ❌ | ❌ | ✅ | ❌ | ❌ |

- `master_admin` is assigned automatically to the organization creator and **cannot be reassigned**.

- Three route-level guards enforce access: `ProtectedRoute` (auth + active subscription), `AdminRoute` (admin roles only), `WriteAccessRoute` (blocks read_only users).

### 4.3 User & Invitation Management

*Admin-only feature.*

- **Invite users** by email with a pre-assigned role (`admin`, `user`, or `read_only`) via the `invite-user` Edge Function.

- **Invitation acceptance** — Invited users receive a link, create credentials if new, and are automatically attached to the inviting organization via the `accept-invitation` Edge Function.

- **Management actions**: View pending invitations, cancel invitations, change active user roles, and remove users (via `delete-user` Edge Function).

- **Plan enforcement**: Active users + pending invitations are counted together against the plan's user cap. Admins see real-time usage indicators and are blocked from inviting when at capacity.

### 4.4 Inventory Management

*Admin-only for CRUD operations; all users can view.*

#### Items

Each item represents a distinct SKU in the warehouse:

| Field | Description |

|---|---|

| `item_code` | Unique SKU identifier (primary key) |

| `description` | Human-readable name |

| `category` | Classification group |

| `vendor` / `vendor_code` | Supplier reference |

| `amount` | Current quantity on hand |

| `initial_quantity` | Original quantity when created |

| `restock_level` | Running total of all restocks |

| `optimal_inventory` | Target stock level |

| `unit_value` | Cost per unit (used for value calculations) |

| `abc_curve` | ABC classification: **A** (high-value), **B** (mid-value), **C** (low-value) |

#### Categories, Vendors, Projects

| Entity | Key Attributes | Notes |

|---|---|---|

| Categories | Name | Classify items into groups |

| Vendors | Name, contact info | Organization-scoped supplier records |

| Projects | Name, active/inactive toggle | Items are checked out **to** a project |

#### Custom Project Label

The "Project" entity supports **customizable naming** per organization. Admins can rename it to "Job", "Work Order", "Contract", etc. This label propagates throughout the UI and QR code formats.

### 4.5 QR Code & Barcode Scanning

*Available to `user`, `admin`, and `master_admin` roles.*

| Capability | Detail |

|---|---|

| Scanner modes | **Checkout** (items leave warehouse to a project) and **Return** (items come back) |

| Scanning method | Camera-based via `html5-qrcode` library |

| QR formats | Structured (`Item code: ITEMXXX`) or plain barcode strings (backward-compatible) |

| Audio feedback | Success beep (1200 Hz, 150 ms) and error beep (300 Hz, 300 ms) via Web Audio API |

| Batch operations | Scan multiple items into a session, adjust quantities, confirm all at once |

| Double-scan prevention | 1.5-second cooldown between scans |

| QR generation | Generate and print QR codes for any item or project — individual or batch print |

### 4.6 Transaction Logs

Every inventory movement is recorded as an immutable transaction log entry.

| Field | Values |

|---|---|

| `transaction_type` | `checkout` or `restock` |

| `entry_type` | `added_item`, `restock`, `checkout`, `return` |

| Associated data | User (who), timestamp (when), item (what), quantity (how much), project (where) |

**Two log views:**

- **Output Logs** — Shows checkouts and returns (materials leaving/returning to warehouse).

- **Input Logs** — Shows restocks, newly added items, and returns.

**Filtering** by entry type, category, project, month, and year. Admins can edit log entries. All log views support pagination and Excel export.

### 4.7 Dashboard

The main landing page after login:

- **Inventory overview** — All items displayed in a searchable grid or list view.

- **ABC classification badges** — Color-coded A/B/C indicators per item.

- **Stock status** — Visual indicators for low stock, overstock, and healthy stock levels.

- **Low-stock logic** — An item is low-stock when `amount ≤ (optimal_inventory × ABC_threshold / 100)`.

- **QR code generation** — Click any item to generate its QR code; print individual or batch-select items for bulk QR printing.

- **Export** — Export the current dashboard view to Excel.

### 4.8 Setup Wizard // (not implemented yet)

*Admin-only, designed for first-time onboarding.*

A 5-step guided flow to bulk-import existing inventory:

| Step | Action |

|---|---|

| **1. Upload** | Drag-and-drop or file-select a CSV or Excel (.xlsx) file |

| **2. Map** | Auto-detected column mapping with manual override for each field |

| **3. Configure** | Set SKU prefix, starting number, and default values |

| **4. Preview** | Review mapped data with validation errors highlighted per row |

| **5. Import** | Bulk insert into the database |

Additional capabilities:

- Downloadable CSV/Excel template for correct formatting.

- Auto-calculate ABC classification from `unit_value × amount` when not provided.

- SKU auto-generation with configurable prefix and sequence.

### 4.9 Excel Export

Five distinct export functions are available throughout the app:

| Export Type | Source Page | Key Columns |

|---|---|---|

| Transaction Logs | Output/Input Logs | Transaction ID, date/time, item, vendor, description, category, qty, unit/total value, person, project, type |

| Low-Stock Report | Dashboard | Item code, vendor, description, category, current/optimal/restock levels, ABC, threshold, shortage value |

| Dashboard Inventory | Dashboard | Code, vendor, description, category, ABC, qty, initial, optimal, total value, status |

| Custom Label Items | Manage | Entity names (categories, vendors, etc.) |

| **Project Items** | Manage | Code, vendor, description, category, ABC, **qty used, returned, unit value, total value** |

> **The Project Items Export is the key differentiator** (not implemented yet) — it produces the material consumption report per project that companies use to accurately bill clients.

All exports are styled Excel files (.xlsx) with bold headers, grey fills, and auto-sized columns, generated via ExcelJS.

### 4.10 Subscription & Billing

Powered by Stripe Checkout and managed via Supabase Edge Functions.

#### Plan Tiers

| Plan | Monthly Price | Max Users | Max Items |

|---|---|---|---|

| Trial | Free (14 days) | 5 | 200 |

| Starter | $59.99 | 5 | 200 |

| Business | $99.99 | 25 | 700 |

| Enterprise | $149.99 | Unlimited | Unlimited |

**All plans include**: unlimited transactions, QR code scanning, ABC classification, transaction logs, Excel exports, and user role management.

#### Subscription Lifecycle

```text
pending → trial (14 days) → active (starter/business/enterprise) → expired
                                  ↕
                          upgrade / downgrade / cancel
```

- **Pending**: New organization before starting trial or subscribing.

- **Trial**: Full access for 14 days with Starter-level limits.

- **Active**: Paid subscription with plan-specific limits.

- **Expired**: Trial ended without subscribing; app is locked; user is redirected to the subscription page.

#### Billing Management Features

- View current plan, status, and billing period.

- Usage progress bars (users and items vs. plan cap).

- **Upgrade** — Instant plan change via `upgrade-subscription-plan` Edge Function.

- **Schedule downgrade** — Downgrade takes effect at end of current billing period via `schedule-subscription-downgrade`.

- **Cancel** — Cancels at period end via `cancel-subscription`.

#### Edge Functions (Billing)

| Function | Auth | Purpose |

|---|---|---|

| `create-checkout-session` | JWT | Creates a Stripe Checkout session |

| `stripe-webhook` | Stripe signature | Processes Stripe events, syncs DB |

| `sync-checkout-session` | JWT | Verifies completed sessions |

| `cancel-subscription` | JWT | Cancels at period end |

| `schedule-subscription-downgrade` | JWT | Schedules tier change |

| `upgrade-subscription-plan` | JWT | Immediate tier upgrade |

| `trial-lifecycle-notifier` | JWT | Trial expiry notifications |

### 4.11 Profile Settings

- View organization name (read-only).

- Edit display name.

- Change password with validation: minimum 10 characters, at least 1 uppercase, 1 lowercase, 1 digit.

### 4.12 Configurations

*Admin-only.*

- **ABC Thresholds** — Set the low-stock percentage threshold per ABC classification (A, B, C).

- **Custom Project Label** — Rename the "Project" entity to match organizational terminology (e.g., "Job", "Work Order").

- **User Management** — Invite, manage roles, and remove users (integrated into the Configurations page).

### 4.13 Analytics

PostHog integration (optional — disabled when API key is missing or placeholder).

~30 tracked events across categories:

| Category | Example Events |

|---|---|

| Authentication | `user_logged_in`, `user_login_failed`, `user_signed_up`, `user_logged_out` |

| Scanner | `scan_started`, `scan_success`, `scan_failed`, `scan_session_completed` |

| Setup Wizard | `wizard_step_started`, `wizard_step_completed`, `wizard_completed`, `wizard_abandoned` |

| Subscription | `subscription_viewed`, `plan_selected`, `checkout_started`, `trial_started`, `trial_expired` |

| Inventory | `item_created`, `item_updated`, `item_deleted`, `category_created`, `project_created` |

| Reports | `logs_viewed`, `filter_applied`, `export_requested`, `search_performed` |

| Settings | `settings_changed` |

User identification and property sync occur on every login via `identifyUser()`.

---

## 5. Data Model Summary

```text
organizations ──┬── profiles (users)
                 ├── items
                 ├── categories
                 ├── vendors
                 ├── projects
                 ├── transaction_logs
                 ├── subscriptions
                 ├── plan_limits
                 ├── organization_invitations
                 └── organization_settings
```

| Entity | Primary Key | Organization-Scoped | Notes |

|---|---|---|---|

| `organizations` | `id` (UUID) | — | Tenant root; holds subscription status |

| `profiles` | `id` (UUID, matches auth.users.id) | Yes | Role, full_name, org membership |

| `items` | `item_code` (string) | Yes | SKU-based; all inventory attributes |

| `projects` | `project_id` (UUID) | Yes | Active/inactive flag |

| `categories` | `id` (UUID) | Yes | Item classification |

| `vendors` | `id` (UUID) | Yes | Supplier with contact info |

| `transaction_logs` | `id` (UUID) | Yes | Full audit trail of all movements |

| `subscriptions` | `id` (UUID) | Yes | Stripe subscription mirror |

| `plan_limits` | `plan` (string) | No (global) | Max users/items per plan tier |

| `organization_invitations` | `id` (UUID) | Yes | Pending/accepted/expired invitations |

| `organization_settings` | `id` (UUID) | Yes | Custom labels, ABC thresholds |

---

## 6. Security Model

| Layer | Implementation |

|---|---|

| **Data isolation** | Supabase Row-Level Security (RLS) on all domain tables — users can only access their own organization's data |

| **Authentication** | Supabase Auth (email/password) with JWT tokens |

| **Edge Function auth** | JWT verification on all functions except `stripe-webhook`, which uses Stripe signature verification |

| **Capacity enforcement** | Database-level triggers prevent item and user inserts beyond plan limits |

| **Brute-force protection** | Client-side math CAPTCHA (3 failures) + lockout (5 failures, 30-second cooldown) |

| **Password policy** | Minimum 10 characters, 1 uppercase, 1 lowercase, 1 digit |

---

## 7. Non-Functional Requirements

| Requirement | Implementation |

|---|---|

| **Responsive design** | Mobile + desktop layouts via `use-mobile` hook and responsive Tailwind classes |

| **Theme support** | Dark/light/system toggle via `next-themes` |

| **Notifications** | Toast messages via `sonner` |

| **Pagination** | All list views support configurable page sizes |

| **Caching** | React Query: 2-minute stale time, 10-minute garbage collection, refetch-on-focus disabled |

| **Deployment** | Vercel (frontend SPA), Supabase (backend, Edge Functions, database) |

| **Testing** | Vitest + Testing Library for unit tests |

| **Linting** | ESLint 9.x with React Hooks + React Refresh plugins |

| **Doc linting** | markdownlint-cli2 for documentation quality |
