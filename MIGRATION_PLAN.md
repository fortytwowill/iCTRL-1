# iCTRL → Open-Source Self-Hosted Fork Migration Plan

## Context
Fork/copy InventoryCtrl (local clone at `/Volumes/External/WILL/InventoryCtrl`, branch `feat/integration-fixes`, commit `91c84ee`) and publish as an open-source self-hosted app named **iCTRL** under the `fortytwowill` GitHub account.

**Current Stack**: Vite 5 + React 18 SPA, Tailwind + shadcn/radix, Supabase (GoTrue auth, Postgres+RLS, edge functions, storage), Stripe billing + plan limits, Vercel, PostHog, next-themes, sonner.
**Target Stack**: better-auth (drizzle adapter, postgres.js), PostgreSQL + Drizzle ORM, Express 5 server, Mantine v8 (patterns from ui.mantine.dev), Puter AI (keyless user-pays), Docker + docker-compose, MIT License.

---

## Step-by-Step Progress

### ✅ Step 1: SaaS Code Removal
- Removed billing, legal gating, analytics, and non-runtime artifacts.
- Deleted `posthog-js`, Stripe, and plan limit logic.
- **Status**: Complete.

### ✅ Step 2: better-auth + Drizzle + Express Server
- Initialized `server/` directory with Express 5.
- Configured better-auth with drizzle adapter and postgres.js.
- Created basic API routes for auth, inventory, projects, and settings.
- **Status**: Complete.

### ✅ Step 3: Mantine UI Refactor
- Replaced all shadcn/ui (`@/components/ui/*`) and `sonner` with Mantine v7/v8 components.
- Applied Mantine patterns from `ui.mantine.dev`.
- **Status**: Complete.

### ✅ Step 4: Client Swap
- Rewrote `src/contexts/AuthContext.tsx` to use `better-auth` client.
- Rewrote `src/hooks/useInventory.ts` and other data-fetching hooks to use the new Express API endpoints instead of Supabase.
- **Status**: Complete.

### ✅ Step 5: Mantine Foundation & Cleanup
- Removed all remaining Supabase client files, legacy UI utilities (`next-themes`, `tailwind-merge`, etc.), and Tailwind directives from `src/index.css`.
- Updated `package.json` to reflect the new dependency tree.
- **Status**: Complete.

### ✅ Step 6: Puter AI Integration
- Added `https://js.puter.com/v2/` script to `index.html`.
- Created `src/lib/puterAI.ts` for keyless AI chat integration.
- **Status**: Complete.

### ✅ Step 7: Docker & CI
- Created `Dockerfile`, `docker-compose.yml`, `.dockerignore`, and `.env.example`.
- **Status**: Complete.

### ✅ Step 8: E2E Verification
- Verified all migration greps are 0 (Supabase, Legacy UI, Shadcn, Secrets).
- Typecheck is clean (`npm run typecheck` exits 0).
- **Status**: Verified.

### ✅ Step 9: Publish
- Created `fortytwowill/iCTRL` repository on GitHub.
- Pushed all migration steps (1-8) to the `feat/step5-github-publish` branch.
- **Status**: Complete.

---

## Next Actions
1. Open a Pull Request from `feat/step5-github-publish` to `main` in the `fortytwowill/iCTRL` repository.
2. Configure GitHub Actions for CI/CD if desired.