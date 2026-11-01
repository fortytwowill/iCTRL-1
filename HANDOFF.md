# Project Handoff

## Objective

Restore platform administration while preserving Will's CapyCo ownership and organization `master_admin` role; eliminate the false legal-acceptance redirect.

## Current state

Migrations `20261004000014` and `20261004000015` are applied. The completed repair is on `fix/admin-org-authority`; publication and production-asset verification are pending. Real authenticated API calls confirm Will remains CapyCo `master_admin`, has platform access, and has accepted the active terms.

## What changed

- Platform authority uses protected `profiles.is_platform_admin`, independently of organization `profiles.role`. Platform promotion and revocation preserve membership, organization role, and ownership.
- Migration 014 removes recursive policies introduced by 012, restores guarded `SECURITY DEFINER` admin RPCs, fixes audit-column mismatches, revokes authenticated reads of `auth.users`, protects platform-privilege writes, and restores the legal-status return contract. Applied migrations 008–013 remain unchanged.
- Migration 015 preserves the existing Total Items metric and excludes items in soft-deleted organizations.
- Frontend adapts the legal RPC's `document_id` to the normalizer's `id`, explicitly scopes the direct acceptance lookup to the signed-in user, and derives platform access only from the flag. No terms acceptance is bypassed or fabricated.
- User-approved baseline repairs remove all lint/typecheck errors while retaining category-filtered transaction queries, password-recovery routing, and existing UI content.
- Separately authorized shared scanner correction: `~/.claude/skills/ship-gate/scripts/secret-scan.sh` no longer mistakes source-code variable references for credential literals. Its adjacent `secret-scan.test.sh` checks 11 positive/negative cases. These workstation files are outside this project PR.

## Validation

- Before repair: signed-in `/admin` redirected to `/legal/accept`; browser and authenticated SQL reported `42P17` profile-policy recursion.
- `npx tsc --noEmit -p tsconfig.app.json`: PASS.
- Full frontend suite: 18 files, 86 tests passed. Lint: zero errors, existing warnings remain. Production Vite build: PASS.
- Rollback-only PostgreSQL regression passes role separation, tenant/legal isolation, settings/invitations, audited trial/promotion/revocation/deletion, escalation/deleted-user denial, and deleted-tenant inventory counts.
- Local browser against the live database saved a trial date, promoted an isolated registered account while preserving its `master_admin` role, soft-deleted its test organization, and revoked only its platform privilege. All four audit actions were observed. The test account, organization, and test audit rows were removed; customer organizations were not changed.
- Signed-in CapyCo UI exposes the Master Admin badge, Invite User dialog, and writable management controls without the false legal redirect.
- Real category-filtered transaction-list and both date-bound GET requests return HTTP 200 with the required inner join preserved.
- Exact transpiled delete-user rejection paths passed with stubbed Supabase clients; notifier sanitization/HTML escaping and real browser QR/audio paths passed. The stubbed edge check is not a live deletion claim.
- Independent complete-diff review: approved after corrections. CodeRabbit unavailable (exit 1, invalid organization); OCR unavailable (exit 1, no configured endpoint). Strix must be rerun against the committed repair; its earlier dirty-tree scan covered the old commit, not this implementation.

## Key files

- `supabase/migrations/20261004000014_separate_platform_admin_authority.sql`
- `supabase/migrations/20261004000015_restore_admin_inventory_statistic.sql`
- `supabase/tests/admin_authority.sql`
- `src/contexts/AuthContext.tsx`
- `src/integrations/supabase/types.ts`
- `src/test/platformAdminAccess.test.tsx`

## Next steps

Run the corrected gate, commit the reviewed branch, scan the committed change, publish through a PR, and verify the actual production deployment. Do not infer deployment success from a fixed delay.
