# Documentation Governance

## Ownership map

- Billing docs owner: engineering owner of Stripe flows
- Analytics docs owner: engineering owner of PostHog taxonomy/instrumentation
- Platform docs owner: engineering owner of Supabase config/secrets

## Required update triggers

Any PR changing these must update docs in the same PR:

- Edge Function secrets/config
- Billing plan names, limits, or prices
- Analytics event names or required properties
- Auth/role behavior affecting operational runbooks

## Review policy

- At least one docs owner review for changes under:
- `supabase/functions/`
- `supabase/migrations/`
- `src/lib/analytics.ts`

## Release checklist

- [ ] Docs lint and link checks passing
- [ ] Env var reference updated
- [ ] Stripe runbook current with function behavior
- [ ] PostHog taxonomy current with emitted events
