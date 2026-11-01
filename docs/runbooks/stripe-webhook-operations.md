# Stripe Webhook Operations Runbook

## Scope

Operational response for Stripe webhook failures and subscription sync drift.

## Primary checks

1. Confirm webhook endpoint URL is correct.
2. Confirm `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard endpoint secret.
3. Check Supabase function logs for `stripe-webhook`.
4. Confirm function config has `verify_jwt = false`.

## Signature failure playbook

Symptoms:

- HTTP 400
- `Webhook signature verification failed`

Actions:

1. Rotate/copy webhook secret and update `STRIPE_WEBHOOK_SECRET`.
2. Re-send failed Stripe event from dashboard.
3. Verify event now processes successfully.

## Replay and idempotency notes

Current implementation uses subscription upsert by `organization_id` and updates by `stripe_subscription_id`.

Checks after replay:

- No duplicate org subscription rows.
- `subscriptions.updated_at` reflects latest replay.

## Subscription drift repair

If Stripe and DB diverge:

1. Fetch subscription in Stripe dashboard.
2. Identify `stripe_subscription_id`.
3. Re-send most recent relevant event (`customer.subscription.updated`).
4. Validate:

- `subscriptions.status`
- `subscriptions.current_period_end`
- `organizations.subscription_status`

## Incident checklist

- [ ] Checkout sessions being created?
- [ ] Webhooks received?
- [ ] Signature validation passing?
- [ ] `subscriptions` table updated?
- [ ] `organizations.subscription_status` synced?
- [ ] Role promotions/demotions correct?

## Escalation

If persistent failure remains after secret/config validation:

1. Pause subscription CTA in frontend release.
2. Keep webhook endpoint active.
3. Perform manual DB sync for affected orgs until fix is deployed.
